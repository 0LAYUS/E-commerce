/**
 * Image optimization for server actions.
 * - Node.js (dev): uses sharp (bundled with Next.js)
 * - Cloudflare Workers (prod): uses photon WASM via workerd entry point
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

  return optimizeWithPhoton(fileBuffer)
}

let photonInitPromise: Promise<void> | null = null

async function ensurePhoton() {
  if (!photonInitPromise) {
    photonInitPromise = (async () => {
      const { initPhoton } = await import("@cf-wasm/photon/others")
      // webpack emits WASM as a separate file via asset/resource
      const wasmPath = (await import("@cf-wasm/photon/photon.wasm")).default

      // Build absolute URL — workerd requires absolute URLs for fetch
      const baseUrl = globalThis.location?.origin ?? "http://localhost:3000"
      const wasmUrl = wasmPath.startsWith("http") ? wasmPath : `${baseUrl}${wasmPath}`

      const response = await fetch(wasmUrl)
      const wasmModule = await WebAssembly.compile(await response.arrayBuffer())

      initPhoton.sync({ module: wasmModule })
    })()
  }
  return photonInitPromise
}

async function optimizeWithPhoton(fileBuffer: Uint8Array): Promise<OptimizedImage> {
  await ensurePhoton()

  const { PhotonImage, SamplingFilter, resize } = await import("@cf-wasm/photon/others")

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
}
