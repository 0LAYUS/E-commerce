"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Shell genérico
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  preventCloseOnOverlayClick?: boolean
}

export function Modal({
  open,
  onClose,
  children,
  className,
  showCloseButton = true,
  preventCloseOnOverlayClick = false,
}: ModalProps) {
  // Bloquear scroll del body
  React.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])

  // Cerrar con Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => {
          if (!preventCloseOnOverlayClick) onClose()
        }}
        aria-hidden="true"
      />

      {/* Contenido con scroll interno si excede el viewport */}
      <div
        className={cn(
          "relative z-50 bg-card rounded-xl shadow-lg border w-full max-w-md max-h-[90vh] overflow-y-auto",
          "animate-in zoom-in-95 fade-in duration-200",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AlertDialog — Un solo botón (reemplaza window.alert)
// ─────────────────────────────────────────────────────────────────────────────

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  acceptText?: string
  onAccept?: () => void
  acceptVariant?: ButtonProps["variant"]
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  acceptText = "Aceptar",
  onAccept,
  acceptVariant = "default",
}: AlertDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="p-6"
      showCloseButton={false}
      preventCloseOnOverlayClick
    >
      <div className="flex flex-col gap-4">
        <div className="pr-6">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant={acceptVariant}
            onClick={() => {
              onAccept?.()
              onClose()
            }}
          >
            {acceptText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDialog — Dos botones: aceptar y cancelar (reemplaza window.confirm)
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  confirmVariant?: ButtonProps["variant"]
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = true,
  confirmVariant = "default",
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="p-6"
      showCloseButton={false}
      preventCloseOnOverlayClick
    >
      <div className="flex flex-col gap-4">
        <div className="pr-6">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </p>
          )}
        </div>

        <div className={cn("flex gap-3 pt-2", showCancel ? "justify-end" : "justify-start")}>
          {showCancel && (
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={destructive ? "destructive" : confirmVariant}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
