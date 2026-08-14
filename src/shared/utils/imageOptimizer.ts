/**
 * Optimizes an image file on the client side using the HTML5 Canvas API.
 * Resizes the image to a maximum width of 1024px and converts it to WebP at 0.8 quality.
 * This avoids needing native Node.js dependencies like sharp which break Cloudflare Pages deployments.
 */
export async function optimizeImage(file: File, maxWidth = 1024, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // We only run this in the browser
    if (typeof window === "undefined") {
      reject(new Error("Image optimization can only run in the browser."));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D context for canvas."));
        return;
      }

      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob returned null."));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for optimization."));
    };

    img.src = objectUrl;
  });
}
