type PersonalInfoSectionProps = {
  firstName: string
  lastName: string
  phone: string
  address: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onAddressChange: (value: string) => void
}

export function PersonalInfoSection({
  firstName,
  lastName,
  phone,
  address,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onAddressChange,
}: PersonalInfoSectionProps) {
  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-ring focus:ring-1 focus:ring-ring transition-colors"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-2">Nombre</label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-2">Apellido</label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClass}
          placeholder="Ej: 3001234567"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">Dirección de residencia</label>
        <input
          id="address"
          name="address"
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className={inputClass}
          placeholder="Av. Principal #123"
        />
      </div>
    </div>
  )
}
