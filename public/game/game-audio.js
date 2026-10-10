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
        attachSpeechSynthesisHooks();
        scanMediaElements(document);

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(scanMediaElements);
                if (mutation.type === 'attributes') registerMedia(mutation.target);
            });
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id', 'name', 'src', 'loop']
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
