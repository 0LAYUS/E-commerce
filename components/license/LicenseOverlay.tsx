"use client"

import Image from "next/image"
import type { MensajeResponse } from "@/lib/actions/licenseActions"

type LicenseOverlayProps = {
  mensaje: MensajeResponse
}

export function LicenseOverlay({ mensaje }: LicenseOverlayProps) {
  return (
    <div className="fixed inset-0 z-[99999] bg-gray-950 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/prigma.jpeg')] bg-no-repeat bg-center bg-cover opacity-5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="w-20 h-20 relative">
                <Image
                  src="/images/prigma_logo_sin_fondo.png"
                  alt="PRIGMA"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-0.5 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full" />
            </div>

            <div className="mb-4">
              <div className="text-xs tracking-widest text-gray-400 mb-2">PRIGMA</div>
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                {mensaje.title}
              </h1>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6" />

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {mensaje.description}
            </p>

            <div className="w-full space-y-3">
              <a
                href="https://wa.me/573224839040?text=Hola%2C%20necesito%20ayuda%20con%20mi%20licencia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar por WhatsApp
              </a>

              <a
                href="mailto:info@prigma.com"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-lg hover:bg-gray-600/50 transition-all duration-300 border border-gray-600/50"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                info@prigma.com
              </a>

              <button
                onClick={() => window.location.href = "/admin"}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600/20 text-green-400 font-medium rounded-lg hover:bg-green-600/30 transition-all duration-300 border border-green-500/30"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Recargar para resolver
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Soluciones de software a medida
          </p>
          <p className="text-xs text-gray-600 mt-1">
            © 2026 PRIGMA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
