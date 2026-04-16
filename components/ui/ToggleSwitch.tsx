"use client"

type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        checked ? "bg-green-500" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}
