"use client";

import { signup } from "@/lib/actions/authActions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Crea tu cuenta</h2>
        <p className="mt-2 text-sm text-gray-600">Únete a nuestra tienda hoy</p>
      </div>
      
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form action={signup} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Registrarse
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="w-full max-w-md p-10 text-center">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
