/**
 * Image optimization for server actions.
 * - Node.js (dev): uses sharp (bundled with Next.js)
 * - Cloudflare Workers (prod): uses photon WASM
 */

const MAX_WIDTH = 1200

export interface OptimizedImage {
  buffer: Uint8Array
  width: number
  height: number
}

let sharpModule: { default: typeof import('sharp') } | null | undefined = undefined

async function getSharp() {
  if (sharpModule === undefined) {
    try {
      sharpModule = await import('sharp')
    } catch {
      sharpModule = null
    }
  }
  return sharpModule
}

export async function optimizeImage(fileBuffer: Uint8Array): Promise<OptimizedImage> {
  const sharpPkg = await getSharp()

  if (sharpPkg) {
    const sharp = sharpPkg.default
    // Node.js dev server: use sharp (bundled with Next.js)
    const instance = sharp(fileBuffer)
    const metadata = await instance.metadata()
    const originalWidth = metadata.width ?? 0

    let processed = instance
    if (originalWidth > MAX_WIDTH) {
      processed = instance.resize({ width: MAX_WIDTH, withoutEnlargement: true })
    }

    const result = await processed.webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
    return {
      buffer: new Uint8Array(result.data),
      width: result.info.width,
      height: result.info.height,
    }
  }

  // Cloudflare Workers prod: use photon WASM
  return optimizeWithPhoton(fileBuffer)
}

async function optimizeWithPhoton(fileBuffer: Uint8Array): Promise<OptimizedImage> {
  try {
    const { PhotonImage, SamplingFilter, resize } = await import("@cf-wasm/photon/workerd")

    // new_from_blob decodes JPEG/PNG/WebP automatically via image crate
    const blob = new Blob([fileBuffer as BlobPart])
    const inputImage = PhotonImage.new_from_blob(blob)

    let outputImage: ReturnType<typeof PhotonImage.new_from_blob>
    const originalWidth = inputImage.get_width()
    const originalHeight = inputImage.get_height()

    if (originalWidth > MAX_WIDTH) {
      const aspectRatio = originalHeight / originalWidth
      const newWidth = MAX_WIDTH
      const newHeight = Math.round(MAX_WIDTH * aspectRatio)
      outputImage = resize(inputImage, newWidth, newHeight, SamplingFilter.Lanczos3)
    } else {
      outputImage = inputImage
    }

    const webpBytes = outputImage.get_bytes_webp()
    const width = outputImage.get_width()
    const height = outputImage.get_height()

    inputImage.free()
    if (outputImage !== inputImage) {
      outputImage.free()
    }

    return { buffer: webpBytes, width, height }
  } catch (err) {
    console.error("Photon optimization failed:", err)
    throw err
  }
}
