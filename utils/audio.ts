
function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    base64: string,
    ctx: AudioContext,
): Promise<AudioBuffer> {
    const data = decodeBase64(base64);
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length; // Assuming mono channel
    const numChannels = 1;
    const buffer = ctx.createBuffer(numChannels, frameCount, ctx.sampleRate);

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * Creates a WAV file Blob from base64 encoded PCM audio data.
 * @param base64 The base64 encoded audio data.
 * @returns A Blob representing the WAV file.
 */
export function createWavBlobFromBase64(base64: string): Blob {
    const pcmData = decodeBase64(base64);
    const sampleRate = 24000; // As used by the TTS model and in the app's AudioContext
    const numChannels = 1; // Mono
    const bitsPerSample = 16; // 16-bit PCM
    const dataSize = pcmData.byteLength;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // chunkSize
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // audioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byteRate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // blockAlign
    view.setUint16(34, bitsPerSample, true);
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    new Uint8Array(buffer).set(pcmData, 44);

    return new Blob([view], { type: 'audio/wav' });
}
