"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, EnvelopeSimple, Phone, MapPin, FacebookLogo, InstagramLogo, TwitterLogo, YoutubeLogo, PaperPlaneTilt, Heart } from "@phosphor-icons/react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      className="bg-card border-t border-border mt-auto relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-800/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-800/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-16 relative">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="col-span-2 md:col-span-1 space-y-5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-700"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <ShoppingBag className="w-5 h-5 text-white" weight="fill" />
              </motion.div>
              <span className="text-xl font-black text-card-foreground tracking-tight">Store</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu tienda online favorita con los mejores productos y precios. Calidad garantizada y envíos a todo el país.
            </p>
            <motion.div
              className="flex gap-3 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { Icon: FacebookLogo, href: "#", label: "Facebook" },
                { Icon: InstagramLogo, href: "#", label: "Instagram" },
                { Icon: TwitterLogo, href: "#", label: "Twitter" },
                { Icon: YoutubeLogo, href: "#", label: "Youtube" },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-border"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.Icon className="w-5 h-5" weight="fill" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-bold text-card-foreground text-lg">Navegación</h3>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/", label: "Inicio" },
                { href: "/products", label: "Productos" },
                { href: "/about", label: "Sobre Nosotros" },
                { href: "/contact", label: "Contacto" },
              ].map((link) => (
                <motion.div
                  key={link.href}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-gray-600 group-hover:w-2 transition-all duration-300" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-card-foreground text-lg">Categorías</h3>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/?category=electronica", label: "Electrónica" },
                { href: "/?category=ropa", label: "Ropa" },
                { href: "/?category=accesorios", label: "Accesorios" },
                { href: "/?category=hogar", label: "Hogar" },
              ].map((link) => (
                <motion.div
                  key={link.href}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-gray-600 transition-all duration-300" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-bold text-card-foreground text-lg">Contacto</h3>
            <div className="flex flex-col gap-4">
              {[
                { Icon: MapPin, text: "Calle 123 #45-67, Bogotá, Colombia" },
                { Icon: Phone, text: "+57 300 123 4567" },
                { Icon: EnvelopeSimple, text: "contacto@store.com" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 text-sm text-muted-foreground group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-gray-700 transition-colors duration-300 border border-border"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.Icon className="w-5 h-5" weight="duotone" />
                  </motion.div>
                  <span className="group-hover:text-card-foreground transition-colors duration-300">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-card-foreground placeholder:text-muted-foreground text-sm border border-border focus:border-gray-600 focus:outline-none transition-colors"
                />
                <motion.button
                  className="px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PaperPlaneTilt className="w-5 h-5 text-white" weight="fill" />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Suscríbete para recibir ofertas exclusivas</p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t border-border mt-12 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              © {currentYear} Store. Todos los derechos reservados.
            </motion.p>
            <motion.div
              className="flex gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { href: "/privacy", label: "Privacidad" },
                { href: "/terms", label: "Términos" },
                { href: "/returns", label: "Devoluciones" },
              ].map((link) => (
                <motion.div
                  key={link.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="mt-6 pt-6 border-t border-border/50 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Hecho con</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-5 h-5 text-red-500" weight="fill" />
              </motion.div>
              <span>usando Next.js y Supabase</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  )
}