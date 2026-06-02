"use client"

import { useState, useRef, useCallback } from "react"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]

type ImageItem = {
  id: string
  url: string
  type: "existing" | "new"
  file?: File
}

type UseProductImagesReturn = {
  imageItems: ImageItem[]
  draggingImageId: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  rejectedFiles: { name: string; reason: string }[]
  clearRejected: () => void
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveImage: (id: string) => void
  handleDragStart: (id: string) => void
  handleDrop: (targetId: string) => void
  closeCleanup: () => void
  setImageItems: React.Dispatch<React.SetStateAction<ImageItem[]>>
}

export function useProductImages(initialImages?: { id: string; url: string }[]): UseProductImagesReturn {
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    initialImages?.map((img) => ({ id: img.id, url: img.url, type: "existing" })) || []
  )
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null)
  const [rejectedFiles, setRejectedFiles] = useState<{ name: string; reason: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const rejected: { name: string; reason: string }[] = []
    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push({ name: file.name, reason: `Formato no soportado. Use JPG, PNG, WebP, GIF, BMP o TIFF.` })
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push({ name: file.name, reason: `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB.` })
        return false
      }
      return true
    })

    if (rejected.length > 0) {
      setRejectedFiles(rejected)
    }

    const newItems = validFiles.map((file) => ({
      id: `new-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}-${file.name}`,
      url: URL.createObjectURL(file),
      type: "new" as const,
      file,
    }))

    setImageItems((prev) => [...prev, ...newItems])
    e.target.value = ""
  }, [])

  const clearRejected = useCallback(() => {
    setRejectedFiles([])
  }, [])

  const handleRemoveImage = useCallback((id: string) => {
    setImageItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      const removed = prev.find((item) => item.id === id)
      if (removed?.type === "new") {
        URL.revokeObjectURL(removed.url)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((id: string) => {
    setDraggingImageId(id)
  }, [])

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggingImageId || draggingImageId === targetId) return
      setImageItems((prev) => {
        const fromIndex = prev.findIndex((item) => item.id === draggingImageId)
        const toIndex = prev.findIndex((item) => item.id === targetId)
        if (fromIndex === -1 || toIndex === -1) return prev
        const updated = [...prev]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved)
        return updated
      })
      setDraggingImageId(null)
    },
    [draggingImageId]
  )

  const closeCleanup = useCallback(() => {
    imageItems.forEach((item) => {
      if (item.type === "new") {
        URL.revokeObjectURL(item.url)
      }
    })
    setDraggingImageId(null)
  }, [imageItems])

  return {
    imageItems,
    draggingImageId,
    fileInputRef,
    rejectedFiles,
    clearRejected,
    handleImageChange,
    handleRemoveImage,
    handleDragStart,
    handleDrop,
    closeCleanup,
    setImageItems,
  }
}
