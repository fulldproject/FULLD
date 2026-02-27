import imageCompression from 'browser-image-compression';

/**
 * Compresses a poster image file for the FULLD platform.
 * - Converts to image/webp
 * - Max dimension: 1200px
 * - Target size: <= 500KB
 */
export async function compressPoster(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8,
    };

    console.log(`[Compression] Starting compression for ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    try {
        const compressedBlob = await imageCompression(file, options);

        // Convert Blob back to File
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
        });

        console.log(`[Compression] Finished. New size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
        return compressedFile;
    } catch (error) {
        console.error('[Compression] Error compressing image:', error);
        // Fallback to original file if compression fails
        return file;
    }
}
