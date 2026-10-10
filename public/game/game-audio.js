(function () {
    'use strict';

    // Every game page loads this file. Keep the audio changes isolated here so
    // the game rules, layout, and other effects do not need to be changed.
    if (window.__lokoGameAudioController) return;
    window.__lokoGameAudioController = true;
    window.__lokoUseExternalBackgroundMusic = true;

    const TRACKS = [
        './musics/snowy.mp3',
        './musics/space.mp3',
        './musics/volcano.mp3'
    ];

    // Background music stays deliberately quiet. It is lowered again while
    // spoken guidance or another audio clip is playing.
    const BACKGROUND_VOLUME = 0.14;
    const DUCKED_VOLUME = 0.035;

    const mediaStates = new WeakMap();
    const speakingMedia = new Set();
    const speakingUtterances = new Set();
    const backgroundFiles = new Set([
        'abnabat.mp3',
        'first1.mp3',
        'forest.mp3',
        'jadooyi forest.mp3',
        'piano (1).mp3',
        'sami.mp3',
        'sami forest.mp3',
        'snowy.mp3',
        'space.mp3',
        'volcano.mp3',
        'z1.mp3'
    ]);

    let backgroundMusic = null;
    let trackIndex = 0;
    let musicStarted = false;
    let startAttemptInProgress = false;

    function getMediaState(media) {
        let state = mediaStates.get(media);
        if (!state) {
            state = {
                isLegacyBackground: false,
                isSilenced: false,
                previousVolume: 1,
                listenersAttached: false
            };
            mediaStates.set(media, state);
        }
        return state;
    }

    function getMediaSource(media) {
        return String(
            media.currentSrc ||
            media.getAttribute('src') ||
            media.src ||
            ''
        ).trim();
    }

    function getFileName(source) {
        if (!source) return '';
        try {
            const url = new URL(source, document.baseURI);
            return decodeURIComponent(url.pathname.split('/').pop() || '').toLowerCase();
        } catch (error) {
            return source.split('/').pop().split('?')[0].toLowerCase();
        }
    }

    function mediaId(media) {
        return String(media.id || media.getAttribute('name') || '').toLowerCase();
    }

    function isBackgroundMedia(media) {
        if (!media || media === backgroundMusic) return false;

        const id = mediaId(media);
        if (/^(bg|bgm|bgmusic|bg-music|theme-music|thememusic)$/.test(id)) return true;
        if (/(guide|voice|speech|narrat|intro|help|verse|tutorial|countdown|sfx|sound)/.test(id)) return false;

        const fileName = getFileName(getMediaSource(media));
        if (backgroundFiles.has(fileName)) return true;

        // Existing background elements are looped. Spoken clips and effects in
        // these games are one-shot, so this also covers dynamically created BGM.
        return media.loop === true && Boolean(fileName);
    }

    function isSpeakingMedia(media) {
        return media && media !== backgroundMusic && !isBackgroundMedia(media);
    }

    function updateBackgroundVolume() {
        if (!backgroundMusic) return;
        backgroundMusic.volume = speakingMedia.size > 0 || speakingUtterances.size > 0
            ? DUCKED_VOLUME
            : BACKGROUND_VOLUME;
    }

    function silenceLegacyBackground(media) {
        const state = getMediaState(media);
        if (!state.isSilenced) {
            state.previousVolume = media.volume;
            state.isSilenced = true;
        }
        if (media.volume !== 0) media.volume = 0;
    }

    function restoreNonBackgroundVolume(media) {
        const state = getMediaState(media);
        if (state.isSilenced) {
            state.isSilenced = false;
            media.volume = state.previousVolume;
        }
    }

    function stopSpeakingMedia(media) {
        speakingMedia.delete(media);
        trackedAudio.delete(media);
        updateBackgroundVolume();
    }

    function startSpeakingMedia(media) {
        if (!isSpeakingMedia(media)) return;
        speakingMedia.add(media);
        updateBackgroundVolume();
    }

    function registerMedia(media) {
        if (!media || !(media instanceof HTMLMediaElement)) return;

        const state = getMediaState(media);
        state.isLegacyBackground = isBackgroundMedia(media);

        if (state.isLegacyBackground) {
            speakingMedia.delete(media);
            silenceLegacyBackground(media);
        } else {
            restoreNonBackgroundVolume(media);
        }

        if (!state.listenersAttached) {
            state.listenersAttached = true;
            media.addEventListener('play', function () {
                registerMedia(media);
                startSpeakingMedia(media);
            });
            media.addEventListener('playing', function () {
                registerMedia(media);
                startSpeakingMedia(media);
            });
            media.addEventListener('pause', function () {
                stopSpeakingMedia(media);
            });
            media.addEventListener('ended', function () {
                stopSpeakingMedia(media);
            });
            media.addEventListener('emptied', function () {
                stopSpeakingMedia(media);
            });
            media.addEventListener('error', function () {
                stopSpeakingMedia(media);
            });
        }
    }

    function scanMediaElements(root) {
        if (!root || !root.querySelectorAll) return;
        if (root instanceof HTMLMediaElement) registerMedia(root);
        root.querySelectorAll('audio, video').forEach(registerMedia);
    }

    function patchMediaPlayback() {
        const mediaPrototype = window.HTMLMediaElement && HTMLMediaElement.prototype;
        if (!mediaPrototype) return;

        const nativePlay = mediaPrototype.play;
        if (typeof nativePlay === 'function' && !nativePlay.__lokoAudioPatched) {
            const patchedPlay = function () {
                registerMedia(this);
                const result = nativePlay.apply(this, arguments);
                if (result && typeof result.then === 'function') {
                    result.then(() => {
                        registerMedia(this);
                        if (!this.paused && !this.ended) startSpeakingMedia(this);
                    }).catch(() => {});
                } else if (!this.paused && !this.ended) {
                    startSpeakingMedia(this);
                }
                return result;
            };
            patchedPlay.__lokoAudioPatched = true;
            mediaPrototype.play = patchedPlay;
        }

        const nativePause = mediaPrototype.pause;
        if (typeof nativePause === 'function' && !nativePause.__lokoAudioPatched) {
            const patchedPause = function () {
                const result = nativePause.apply(this, arguments);
                stopSpeakingMedia(this);
                return result;
            };
            patchedPause.__lokoAudioPatched = true;
            mediaPrototype.pause = patchedPause;
        }

        // The original games sometimes reset their music volume after this
        // controller has silenced it. Keep only their old background track
        // silent without affecting voices or sound effects.
        const volumeDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, 'volume');
        if (volumeDescriptor && volumeDescriptor.get && volumeDescriptor.set && volumeDescriptor.configurable) {
            const patchedVolume = {
                configurable: true,
                enumerable: volumeDescriptor.enumerable,
                get: volumeDescriptor.get,
                set: function (value) {
                    if (isBackgroundMedia(this)) {
                        const state = getMediaState(this);
                        if (!state.isSilenced) {
                            state.previousVolume = value;
                            state.isSilenced = true;
                        }
                        volumeDescriptor.set.call(this, 0);
                    } else {
                        volumeDescriptor.set.call(this, value);
                    }
                }
            };
            Object.defineProperty(mediaPrototype, 'volume', patchedVolume);
        }
    }

    function attachSpeechSynthesisHooks() {
        const synth = window.speechSynthesis;
        if (!synth || typeof synth.speak !== 'function') return;

        const nativeSpeak = synth.speak.bind(synth);
        const nativeCancel = typeof synth.cancel === 'function' ? synth.cancel.bind(synth) : null;

        const wrappedSpeak = function (utterance) {
            let release = null;
            if (utterance) {
                speakingUtterances.add(utterance);
                updateBackgroundVolume();

                release = function () {
                    speakingUtterances.delete(utterance);
                    updateBackgroundVolume();
                };

                if (typeof utterance.addEventListener === 'function') {
                    utterance.addEventListener('end', release, { once: true });
                    utterance.addEventListener('error', release, { once: true });
                }
            }
            try {
                return nativeSpeak(utterance);
            } catch (error) {
                if (release) release();
                throw error;
            }
        };

        try {
            synth.speak = wrappedSpeak;
        } catch (error) {
            return;
        }

        if (nativeCancel) {
            try {
                synth.cancel = function () {
                    speakingUtterances.clear();
                    updateBackgroundVolume();
                    return nativeCancel();
                };
            } catch (error) {
                // Some browsers expose speechSynthesis.cancel as read-only.
            }
        }
    }

    // ---------------------------------------------------------------------
    // Shared guide controls
    // ---------------------------------------------------------------------
    // The game pages use several different guide/tutor implementations. A
    // small shared layer keeps the user-facing skip action consistent without
    // replacing any of the guides or their audio files.
    const GUIDE_TOKEN_PATTERN = /(?:guide|tutorial|help|narrat|intro|voice|speech)/i;
    const GUIDE_LEAF_PATTERN = /(?:text|char|avatar|bubble|step|header|title|progress|bar|audio|skip|button|nav|dots|icon|img|hint|message|line|description|list)/i;
    const trackedAudio = new Set();
    let guideScanQueued = false;

    function isMediaElement(value) {
        return Boolean(
            value &&
            window.HTMLMediaElement &&
            value instanceof window.HTMLMediaElement
        );
    }

    function patchAudioConstructor() {
        const nativeAudio = window.Audio;
        if (typeof nativeAudio !== 'function' || nativeAudio.__lokoGuideAudioPatched) return;

        const trackedAudioConstructor = function () {
            const media = new nativeAudio(...arguments);
            trackedAudio.add(media);
            registerMedia(media);
            return media;
        };
        trackedAudioConstructor.prototype = nativeAudio.prototype;
        trackedAudioConstructor.__lokoGuideAudioPatched = true;
        try {
            window.Audio = trackedAudioConstructor;
        } catch (error) {
            // Audio can be read-only in a few embedded browsers.
        }
    }

    function stopGuidanceMedia() {
        const candidates = new Set(trackedAudio);
        speakingMedia.forEach(media => candidates.add(media));
        document.querySelectorAll('audio, video').forEach(media => candidates.add(media));

        // A few games keep a dynamically-created guide clip in a named
        // variable rather than in the DOM. Include those conventional names.
        [
            'guideAudio', 'tutorialAudio', 'helpAudio', 'introAudio',
            'voiceAudio', 'activeAudio', 'narratorAudio'
        ].forEach(name => {
            const media = window[name];
            if (isMediaElement(media)) candidates.add(media);
        });

        candidates.forEach(media => {
            if (!isMediaElement(media) || media === backgroundMusic || isBackgroundMedia(media)) return;
            try {
                media.pause();
                media.currentTime = 0;
            } catch (error) {}
            speakingMedia.delete(media);
        });

        const synth = window.speechSynthesis;
        if (synth && typeof synth.cancel === 'function') {
            try { synth.cancel(); } catch (error) {}
        }
        speakingUtterances.clear();
        updateBackgroundVolume();
    }

    function guideElementToken(element) {
        if (!element || element.nodeType !== 1) return '';
        return String(
            (element.id || '') + ' ' +
            (typeof element.className === 'string' ? element.className : '') + ' ' +
            (element.getAttribute('data-role') || '')
        ).toLowerCase();
    }

    function isGuideLikeElement(element) {
        return Boolean(
            element &&
            element.nodeType === 1 &&
            GUIDE_TOKEN_PATTERN.test(guideElementToken(element))
        );
    }

    function isGuideLeafElement(element) {
        return GUIDE_LEAF_PATTERN.test(guideElementToken(element));
    }

    function isElementVisible(element) {
        if (!element || element.nodeType !== 1) return false;
        let current = element;
        while (current && current.nodeType === 1) {
            if (current.hidden) return false;
            const classList = current.classList;
            if (classList && (
                classList.contains('hidden') ||
                classList.contains('d-none') ||
                classList.contains('is-hidden') ||
                classList.contains('invisible')
            )) return false;
            let style = null;
            try {
                style = window.getComputedStyle(current);
            } catch (error) {
                // A malformed page stylesheet should not disable guide controls.
            }
            if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
            current = current.parentElement;
        }
        return true;
    }

    function guideContainerScore(element) {
        const token = guideElementToken(element);
        let score = 0;
        if (/container|content|card|panel|wrapper|wrap|box/.test(token)) score += 5;
        if (/modal|overlay/.test(token)) score += 4;
        if (/screen|page|section/.test(token)) score += 1;
        if (isGuideLeafElement(element)) score -= 4;
        return score;
    }

    function isSkipControl(element) {
        if (!element || element.nodeType !== 1) return false;
        const identity = String(
            (element.id || '') + ' ' +
            (typeof element.className === 'string' ? element.className : '') + ' ' +
            (element.getAttribute('aria-label') || '')
        );
        const label = String(element.textContent || '');
        // Completion buttons often say «بزن بریم» too; only treat that
        // wording as a skip control when the control is explicitly named as
        // one. The visible Persian "رد کردن" label is unambiguous.
        return /(?:skip|guide-skip|tutorial-skip)/i.test(identity) || /رد\s*کردن/i.test(label);
    }

    function addGuideButtonStyles() {
        if (document.getElementById('loko-guide-skip-styles')) return;
        const style = document.createElement('style');
        style.id = 'loko-guide-skip-styles';
        style.textContent = `
            .loko-guide-skip {
                position: static !important;
                inset: auto !important;
                display: block !important;
                visibility: visible !important;
                width: auto !important;
                min-width: 150px !important;
                min-height: 44px !important;
                height: auto !important;
                margin: 14px auto 0 !important;
                padding: 10px 24px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                z-index: 20 !important;
                font-size: .95rem !important;
                line-height: 1.4 !important;
                opacity: 1 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function guideActionScope(container) {
        let current = container;
        while (current && current !== document.body) {
            const token = guideElementToken(current);
            if (current !== container && /screen|page|modal|overlay/.test(token)) return current;
            current = current.parentElement;
        }
        return container;
    }

    function getGuideExitFunction(container) {
        const tokens = [];
        let current = container;
        while (current && current !== document.body) {
            tokens.push(guideElementToken(current));
            current = current.parentElement;
        }
        const token = tokens.join(' ');
        const names = [];
        if (/voice/.test(token)) names.push('skipVoiceGuide', 'finishVoiceGuide');
        if (/tutorial/.test(token)) {
            names.push('skipTutorial', 'tutorialSkip', 'finishTutorial', 'endTutorial', 'hideTutorialScreen');
        }
        if (/help/.test(token)) names.push('skipHelp', 'finishHelp', 'closeHelp', 'hideHelp');
        if (/intro/.test(token)) names.push('skipIntro', 'finishIntro', 'closeIntro');
        names.push('skipGuide', 'finishGuide', 'endGuide', 'closeGuide');

        const uniqueNames = [...new Set(names)];
        for (const name of uniqueNames) {
            if (typeof window[name] === 'function') return window[name];
        }
        return null;
    }

    function findGuideFallbackControl(container, skipButton) {
        const scope = guideActionScope(container);
        const controls = [...scope.querySelectorAll(
            'button, [role="button"], a, input[type="button"], input[type="submit"]'
        )].filter(control => control !== skipButton && isElementVisible(control));
        return controls.find(control => {
            const token = String(
                (control.id || '') + ' ' +
                (typeof control.className === 'string' ? control.className : '') + ' ' +
                (control.getAttribute('aria-label') || '') + ' ' +
                (control.getAttribute('data-go') || '') + ' ' +
                (control.getAttribute('data-back') || '') + ' ' +
                (control.getAttribute('onclick') || '') + ' ' +
                (control.textContent || '')
            );
            return /(?:close|back|home|بازگشت|بستن|فهمیدم|بزن\s*بریم|شروع|ورود)/i.test(token);
        }) || null;
    }

    function hideGuideAsLastResort(container) {
        if (!container) return;
        const scope = guideActionScope(container);
        scope.classList.remove('active', 'show', 'open', 'visible');
        if (/screen|overlay|modal/.test(guideElementToken(scope))) {
            scope.style.setProperty('display', 'none', 'important');
        }
    }

    function invokeGuideExit(button, container, event) {
        const exitFunction = getGuideExitFunction(container);
        if (exitFunction) {
            try {
                exitFunction(event);
                return true;
            } catch (error) {
                console.warn('Guide skip handler failed:', error);
            }
        }

        // Inline handlers can reference lexical variables or page-specific
        // objects (for example oceanGame), so retain them as a fallback.
        if (typeof button.onclick === 'function') {
            try {
                button.onclick.call(button, event);
                return true;
            } catch (error) {}
        }

        const fallback = findGuideFallbackControl(container, button);
        if (fallback) {
            try {
                if (!isElementVisible(fallback)) {
                    fallback.classList.remove('hidden');
                    fallback.style.removeProperty('display');
                }
                fallback.click();
                return true;
            } catch (error) {}
        }

        hideGuideAsLastResort(container);
        return false;
    }

    function bindGuideSkipButton(button, container, injected) {
        if (button.dataset.lokoGuideSkipBound === 'true') {
            if (button.dataset.lokoGuideContainer !== (container.id || '')) {
                button.dataset.lokoGuideContainer = container.id || '';
            }
            return;
        }
        button.dataset.lokoGuideSkipBound = 'true';
        button.dataset.lokoGuideInjected = injected ? 'true' : 'false';
        button.dataset.lokoGuideContainer = container.id || '';
        button.addEventListener('click', function (event) {
            stopGuidanceMedia();

            // Existing controls keep their page's listener when no shared
            // handler is available. Injected controls always need a route.
            const hasRoute = Boolean(getGuideExitFunction(container));
            if (!injected && !hasRoute) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            invokeGuideExit(button, container, event);
        }, true);
    }

    function setImportantStyleIfNeeded(element, property, value) {
        if (
            element.style.getPropertyValue(property) !== value ||
            element.style.getPropertyPriority(property) !== 'important'
        ) {
            element.style.setProperty(property, value, 'important');
        }
    }

    function prepareGuideSkipButton(button, container, injected) {
        if (!button || !container) return;
        if (button.parentElement !== container) container.appendChild(button);

        if (!button.classList.contains('loko-guide-skip')) {
            button.classList.add('loko-guide-skip');
        }
        if (button.hasAttribute('hidden')) button.removeAttribute('hidden');
        ['hidden', 'd-none', 'is-hidden', 'invisible'].forEach(className => {
            if (button.classList.contains(className)) button.classList.remove(className);
        });
        if (button.textContent !== '⏭️ رد کردن') button.textContent = '⏭️ رد کردن';
        if (button.getAttribute('aria-label') !== 'رد کردن راهنما') {
            button.setAttribute('aria-label', 'رد کردن راهنما');
        }
        if (button.tagName === 'BUTTON' && !button.getAttribute('type')) {
            button.setAttribute('type', 'button');
        }
        setImportantStyleIfNeeded(button, 'display', 'block');
        setImportantStyleIfNeeded(button, 'position', 'static');
        setImportantStyleIfNeeded(button, 'inset', 'auto');
        bindGuideSkipButton(button, container, injected);
    }

    function elementDepth(element) {
        let depth = 0;
        let current = element;
        while (current && current.parentElement) {
            depth += 1;
            current = current.parentElement;
        }
        return depth;
    }

    function guideGroupingElement(element) {
        let current = element.parentElement;
        while (current && current !== document.body) {
            const token = guideElementToken(current);
            if (isGuideLikeElement(current) && /screen|page|modal/.test(token)) return current;
            current = current.parentElement;
        }
        return null;
    }

    function guideContainersInDocument() {
        const candidates = [...document.querySelectorAll('body *')].filter(element => {
            if (!isGuideLikeElement(element) || isGuideLeafElement(element)) return false;
            if (/^(button|a|input|audio|video)$/i.test(element.tagName)) return false;
            return isElementVisible(element);
        });

        // Prefer the semantic guide card/content element over its screen
        // wrapper, then skip descendants once a container has been selected.
        candidates.sort((a, b) => {
            const scoreDifference = guideContainerScore(b) - guideContainerScore(a);
            if (scoreDifference) return scoreDifference;
            return elementDepth(b) - elementDepth(a);
        });
        const selected = [];
        const grouped = new Set();
        candidates.forEach(candidate => {
            if (selected.some(selectedElement => selectedElement.contains(candidate))) return;
            if (selected.some(selectedElement => candidate.contains(selectedElement))) return;
            const group = guideGroupingElement(candidate);
            if (group && grouped.has(group)) return;
            if (group) grouped.add(group);
            selected.push(candidate);
        });
        return selected;
    }

    function scanGuideControls() {
        guideScanQueued = false;
        if (!document.body) return;
        addGuideButtonStyles();

        const containers = guideContainersInDocument();
        containers.forEach(container => {
            let skipButton = [...container.querySelectorAll(
                'button, [role="button"], input[type="button"], input[type="submit"]'
            )].find(isSkipControl);

            if (!skipButton) {
                skipButton = document.createElement('button');
                skipButton.type = 'button';
                skipButton.className = 'loko-guide-skip';
                skipButton.textContent = '⏭️ رد کردن';
                container.appendChild(skipButton);
                prepareGuideSkipButton(skipButton, container, true);
            } else {
                prepareGuideSkipButton(skipButton, container, false);
            }
        });
    }

    function scheduleGuideScan() {
        if (guideScanQueued) return;
        guideScanQueued = true;
        const schedule = window.requestAnimationFrame || function (callback) {
            return window.setTimeout(callback, 0);
        };
        schedule(scanGuideControls);
    }

    function nextTrack() {
        if (!backgroundMusic) return;
        trackIndex = (trackIndex + 1) % TRACKS.length;
        backgroundMusic.src = TRACKS[trackIndex];
        backgroundMusic.load();
        updateBackgroundVolume();
        if (musicStarted) backgroundMusic.play().catch(() => {});
    }

    function createBackgroundMusic() {
        if (backgroundMusic) return backgroundMusic;

        backgroundMusic = document.createElement('audio');
        backgroundMusic.preload = 'auto';
        backgroundMusic.loop = false;
        backgroundMusic.setAttribute('aria-hidden', 'true');
        backgroundMusic.setAttribute('playsinline', '');
        backgroundMusic.dataset.lokoBackgroundMusic = 'true';
        backgroundMusic.src = TRACKS[trackIndex];
        backgroundMusic.addEventListener('ended', nextTrack);
        backgroundMusic.addEventListener('error', nextTrack);
        document.body.appendChild(backgroundMusic);
        updateBackgroundVolume();
        return backgroundMusic;
    }

    function startBackgroundMusic() {
        if (musicStarted || startAttemptInProgress) return;
        startAttemptInProgress = true;
        const music = createBackgroundMusic();
        let playResult;
        try {
            playResult = music.play();
        } catch (error) {
            startAttemptInProgress = false;
            return;
        }

        if (playResult && typeof playResult.then === 'function') {
            playResult.then(() => {
                musicStarted = true;
                startAttemptInProgress = false;
                removeUnlockListeners();
                updateBackgroundVolume();
            }).catch(() => {
                startAttemptInProgress = false;
            });
        } else {
            musicStarted = true;
            startAttemptInProgress = false;
            removeUnlockListeners();
            updateBackgroundVolume();
        }
    }

    function installUnlockListeners() {
        ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (eventName) {
            document.addEventListener(eventName, startBackgroundMusic, { capture: true, passive: true });
        });
    }

    function removeUnlockListeners() {
        ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (eventName) {
            document.removeEventListener(eventName, startBackgroundMusic, true);
        });
    }

    function init() {
        patchMediaPlayback();
        patchAudioConstructor();
        attachSpeechSynthesisHooks();
        scanMediaElements(document);
        scheduleGuideScan();

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    scanMediaElements(node);
                });
                if (mutation.type === 'attributes') registerMedia(mutation.target);
            });
            scheduleGuideScan();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id', 'name', 'src', 'loop', 'class', 'style', 'hidden']
        });

        installUnlockListeners();
        window.addEventListener('pagehide', function () {
            if (backgroundMusic) backgroundMusic.pause();
        });
        window.addEventListener('pageshow', function () {
            if (musicStarted && backgroundMusic) backgroundMusic.play().catch(() => {});
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
}());
