import {
  PhotonImage,
  SamplingFilter,
  resize,
  initPhoton,
} from "@cf-wasm/photon/others"
import photonWasmUrl from "@cf-wasm/photon/photon.wasm"

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await initPhoton({ module_or_path: new URL(photonWasmUrl, import.meta.url) })
    initialized = true
  }
}

const MAX_WIDTH = 1200

export interface OptimizedImage {
  buffer: Uint8Array
  width: number
  height: number
}

export async function optimizeImage(fileBuffer: Uint8Array): Promise<OptimizedImage> {
  await ensureInitialized()

  const inputImage = PhotonImage.new_from_byteslice(fileBuffer)

  let outputImage: PhotonImage
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
