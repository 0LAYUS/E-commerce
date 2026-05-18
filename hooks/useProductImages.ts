"use client"

import { useState, useRef, useCallback } from "react"

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newItems = files.map((file) => ({
      id: `new-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}-${file.name}`,
      url: URL.createObjectURL(file),
      type: "new" as const,
      file,
    }))

    setImageItems((prev) => [...prev, ...newItems])
    e.target.value = ""
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
    handleImageChange,
    handleRemoveImage,
    handleDragStart,
    handleDrop,
    closeCleanup,
    setImageItems,
  }
}
