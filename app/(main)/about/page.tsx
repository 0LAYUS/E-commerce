"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ShieldCheck, TruckIcon, Trophy, Users, Package, Clock, ChatCircle, MapPin, Calendar, Storefront } from "@phosphor-icons/react"
import { storeBranding } from "@/lib/constants/branding-store"

export default function AboutPage() {
  return (
    <div className="flex flex-col space-y-10 max-w-screen-2xl mx-auto px-6 py-8">
      <motion.div
        className="text-center py-10 bg-card rounded-2xl shadow-lg border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-card-foreground">
          {storeBranding.about.heroTitle}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {storeBranding.about.heroDescription}
        </p>
      </motion.div>

      <motion.div
        className="bg-card rounded-2xl shadow-lg border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={storeBranding.assets.aboutHero}
            alt={`${storeBranding.name} - Tienda online`}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 text-primary-foreground">
              <h2 className="text-2xl font-extrabold">Nuestra Historia</h2>
              <p className="text-primary-foreground/80 mt-1 flex items-center gap-2">
                <Storefront className="w-4 h-4" />
                {storeBranding.about.storySubtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <p className="text-muted-foreground leading-relaxed">
            {storeBranding.about.storyText}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="bg-card rounded-2xl shadow-lg border border-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-extrabold text-card-foreground mb-3">Nuestra Misión</h3>
          <p className="text-muted-foreground leading-relaxed">
            {storeBranding.about.mission}
          </p>
        </motion.div>
        <motion.div
          className="bg-card rounded-2xl shadow-lg border border-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-extrabold text-card-foreground mb-3">Nuestra Visión</h3>
          <p className="text-muted-foreground leading-relaxed">
            {storeBranding.about.vision}
          </p>
        </motion.div>
      </div>

      <motion.div
        className="bg-card rounded-2xl shadow-lg border border-border p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-extrabold text-card-foreground mb-6 text-center">Nuestros Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" weight="fill" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Confianza y Seguridad</h3>
            <p className="text-sm text-muted-foreground">
              Tus datos y transacciones están protegidos con los más altos estándares de seguridad.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
              <TruckIcon className="w-7 h-7 text-primary-foreground" weight="fill" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Envío Rápido</h3>
            <p className="text-sm text-muted-foreground">
              Envíos a todo el país con tiempos de entrega optimizados para tu comodidad.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
              <Trophy className="w-7 h-7 text-primary-foreground" weight="fill" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Calidad Garantizada</h3>
            <p className="text-sm text-muted-foreground">
              Productos seleccionados cuidadosamente para asegurar la mejor experiencia de compra.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="bg-card rounded-2xl shadow-lg border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="relative h-48 w-full">
            <Image
              src={storeBranding.assets.aboutTeam}
              alt="Nuestro equipo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-6">
            <h3 className="text-lg font-extrabold text-card-foreground mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" weight="fill" />
              Nuestro Equipo
            </h3>
            <p className="text-muted-foreground text-sm">
              {storeBranding.about.teamText}
            </p>
          </div>
        </motion.div>
        <motion.div
          className="bg-card rounded-2xl shadow-lg border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="relative h-48 w-full">
            <Image
              src={storeBranding.assets.aboutWarehouse}
              alt={`Almacén ${storeBranding.name}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-6">
            <h3 className="text-lg font-extrabold text-card-foreground mb-2 flex items-center gap-2">
              <Package className="w-5 h-5" weight="fill" />
              Nuestro Almacén
            </h3>
            <p className="text-muted-foreground text-sm">
              {storeBranding.about.warehouseText}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="bg-card rounded-2xl shadow-lg border border-border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border border-border">
              <MapPin className="w-8 h-8 text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h3 className="font-extrabold text-card-foreground">Ubicación</h3>
              <p className="text-muted-foreground text-sm">{storeBranding.contact.city}, {storeBranding.contact.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border border-border">
              <Calendar className="w-8 h-8 text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h3 className="font-extrabold text-card-foreground">Horario</h3>
              <p className="text-muted-foreground text-sm">{storeBranding.contact.schedule}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, stat: storeBranding.about.stats.clients, label: "Clientes" },
          { icon: Package, stat: storeBranding.about.stats.products, label: "Productos" },
          { icon: Clock, stat: storeBranding.about.stats.years, label: "Años" },
          { icon: ShieldCheck, stat: storeBranding.about.stats.secure, label: "Seguro" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="bg-card rounded-2xl shadow-lg border border-border p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
          >
            <item.icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" weight="fill" />
            <p className="text-3xl font-extrabold text-card-foreground">{item.stat}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link
          href="/"
          className="bg-secondary text-primary-foreground hover:bg-accent px-6 py-3 rounded-xl font-medium transition-all border border-border shadow-lg"
        >
          Ver Productos
        </Link>
      </div>

      <a
        href={`https://wa.me/${storeBranding.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-success hover:bg-success/90 rounded-full flex items-center justify-center shadow-lg transition-all z-50"
        aria-label="Contactar por WhatsApp"
      >
        <ChatCircle className="w-7 h-7 text-success-foreground" weight="fill" />
      </a>
    </div>
  )
}