/**
 * Converts a base64 string to a File object.
 * @param base64 The base64 encoded string.
 * @param filename The desired name for the file.
 * @param mimeType The MIME type of the file.
 * @returns A File object.
 */
export function base64toFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
}
