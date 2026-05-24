export const storeBranding = {
  // Core identity
  name: "Vitaminas Pa' Ti",
  description:
    "Tienda online — Encuentra los mejores productos con envío a toda Colombia.",
  url: "http://localhost:3000",
  locale: "es_CO" as const,

  // Contact
  contact: {
    phone: "+57 300 123 4567",
    email: "contacto@mitienda.com",
    address: "Calle 123 #45-67",
    city: "Bogotá",
    country: "Colombia",
    schedule: "Lunes a Viernes 9am - 6pm",
  },
  whatsapp: "573001234567",

  // Social
  social: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
    youtube: "#",
  },

  // Legal
  legal: {
    foundingYear: 2020,
    copyrightName: "Mi Tienda",
  },

  // Assets
  assets: {
    logo: "/images/brandClient/isotipo.png",
    logoIcon: "/images/brandClient/isotipo.png",
    logoText: "/images/brandClient/logotipo.png",
    logoFull: "/images/brandClient/imagotipo.png",
    favicon: "/images/brandClient/isotipo.png",
    ogImage: "/images/brandClient/imagotipo.png",
  },

  // About page content
  about: {
    heroTitle: "Sobre Nosotros",
    heroDescription:
      "Conoce la historia detrás de Mi Tienda, tu tienda online de confianza en Colombia.",
    storyTitle: "Nuestra Historia",
    storySubtitle: "Desde 2020 conectando a Colombia",
    storyText:
      "Mi Tienda nació en 2020 con la misión de ofrecer productos de calidad a precios accesibles para todos los colombianos. Comenzamos como una pequeña tienda local y gracias a la confianza de nuestros clientes, hoy somos una de las tiendas online más reconocidas del país, conectando a miles de personas con productos que necesitan.",
    mission:
      "Brindar acceso a productos de calidad a precios justos, facilitando la vida cotidiana de las familias colombianas a través de una experiencia de compra segura, rápida y confiable.",
    vision:
      "Ser la tienda online preferida de los colombianos, reconocida por nuestra excelencia en atención al cliente, innovación tecnológica y compromiso con la satisfacción del usuario.",
    tagline:
      "Tu tienda online favorita con los mejores productos y precios. Calidad garantizada y envíos a todo el país.",
    teamText:
      "Un equipo apasionado trabajando cada día para brindarte la mejor experiencia de compra online en Colombia.",
    warehouseText:
      "Miles de productos listos para enviarte con la mayor brevedad posible.",
    stats: {
      clients: "10K+",
      products: "5K+",
      years: "5+",
      secure: "100%",
    } as const,
  },
} as const;
