export function PasswordChangeSection() {
  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-ring focus:ring-1 focus:ring-ring transition-colors"

  return (
    <div>
      <h3 className="text-lg font-medium text-foreground mb-4">Actualizar Contraseña</h3>
      <p className="text-sm text-muted-foreground mb-6">Deja estos campos en blanco si no deseas cambiar tu contraseña actual.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Nueva Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-foreground mb-2">Confirmar Nueva Contraseña</label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      </div>
    </div>
  )
}
