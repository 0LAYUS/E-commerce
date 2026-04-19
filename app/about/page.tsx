import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, TruckIcon, Award, Users, Package, Clock, MessageCircle, MapPin, Calendar, Store } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col space-y-10">
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border mt-4 border-gray-100">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
          Sobre Nosotros
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Conoce la historia detrás de WompiStore, tu tienda online de confianza en Colombia.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
            alt="WompiStore - Tienda online"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h2 className="text-2xl font-extrabold">Nuestra Historia</h2>
              <p className="text-white/80 mt-1 flex items-center gap-2">
                <Store className="w-4 h-4" />
                Desde 2020 conectando a Colombia
              </p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <p className="text-gray-600 leading-relaxed">
            WompiStore nació en 2020 con la misión de ofrecer productos de calidad a precios accesibles para todos los colombianos. 
            Comenzamos como una pequeña tienda local y gracias a la confianza de nuestros clientes, 
            hoy somos una de las tiendas online más reconocidas del país, conectando a miles de personas con productos que necesitan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-extrabold text-foreground mb-3">Nuestra Misión</h3>
          <p className="text-gray-600 leading-relaxed">
            Brindar acceso a productos de calidad a precios justos, facilitando la vida cotidiana de las familias colombianas 
            a través de una experiencia de compra segura, rápida y confiable.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-extrabold text-foreground mb-3">Nuestra Visión</h3>
          <p className="text-gray-600 leading-relaxed">
            Ser la tienda online preferida de los colombianos, reconocidas por nuestra excelencia en atención al cliente, 
            innovación tecnológica y compromiso con la satisfacción del usuario.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-2xl font-extrabold text-foreground mb-6 text-center">Nuestros Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Confianza y Seguridad</h3>
            <p className="text-sm text-gray-600">
              Tus datos y transacciones están protegidos con los más altos estándares de seguridad.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Envío Rápido</h3>
            <p className="text-sm text-gray-600">
              Envíos a todo el país con tiempos de entrega optimizados para tu comodidad.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Calidad Garantizada</h3>
            <p className="text-sm text-gray-600">
              Productos seleccionados cuidadosamente para asegurar la mejor experiencia de compra.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="relative h-48 w-full">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=200&fit=crop"
              alt="Nuestro equipo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-6">
            <h3 className="text-lg font-extrabold text-foreground mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Nuestro Equipo
            </h3>
            <p className="text-gray-600 text-sm">
              Un equipo apasionado trabajando每一天 para brindarte la mejor experiencia de compra online en Colombia.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="relative h-48 w-full">
            <Image
              src="https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600&h=200&fit=crop"
              alt="Almacén WompiStore"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-6">
            <h3 className="text-lg font-extrabold text-foreground mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Nuestro Almacén
            </h3>
            <p className="text-gray-600 text-sm">
              Miles de productos listos para enviarte con la mayor brevedad posible.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground">Ubicación</h3>
              <p className="text-gray-600 text-sm">Bogotá, Colombia</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground">Horario</h3>
              <p className="text-gray-600 text-sm">Lunes a Viernes 9am - 6pm</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-extrabold text-foreground">10K+</p>
          <p className="text-sm text-muted-foreground">Clientes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <Package className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-extrabold text-foreground">5K+</p>
          <p className="text-sm text-muted-foreground">Productos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-extrabold text-foreground">5+</p>
          <p className="text-sm text-muted-foreground">Años</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-extrabold text-foreground">100%</p>
          <p className="text-sm text-muted-foreground">Seguro</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition"
        >
          Ver Productos
        </Link>
      </div>

      <a
        href="https://wa.me/573001234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </div>
  );
}