let cachedAudioContext: AudioContext | null = null;

export function getAudioContext() {
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextConstructor) {
        return null;
    }

    if (cachedAudioContext) {
        return cachedAudioContext;
    }

    try {
        cachedAudioContext = new AudioContextConstructor();
        return cachedAudioContext;
    } catch (err) {
        console.error("Failed to instantiate AudioContext", err);
        return null;
    }
}
