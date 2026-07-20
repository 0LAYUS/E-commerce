export const storeBranding = {
  // Core identity
  name: "PRIGMA",
  description:
    "Desarrollo de software personalizado para empresas en Colombia. Apps web, móviles y sistemas ERP/CRM.",
  url: "https://prigma.net",
  locale: "es_CO" as const,

  // Theme
  theme: {
    defaultTheme: "dark", // Can be "light", "dark", or "system"
  },

  // Contact
  contact: {
    phone: "+57 311 2078781",
    email: "contacto@prigma.net",
    address: "Colombia",
    city: "Sogamoso",
    country: "Colombia",
    schedule: "Lunes a Viernes 8am - 6pm",
  },
  whatsapp: "573112078781",

  // Social
  social: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
    youtube: "#",
  },

  // Legal
  legal: {
    copyrightName: "PRIGMA",
  },

  // Assets
  assets: {
    logo: "/images/brandClient/prigma_logo_sin_fondo.png",
    logoIcon: "/images/brandClient/prigma_logo_sin_fondo.png",
    logoText: "/images/brandClient/prigma_logo_sin_fondo.png",
    logoFull: "/images/brandClient/prigma_logo_sin_fondo.png",
    favicon: "/images/brandClient/prigma_logo_sin_fondo.png",
    ogImage: "/images/brandClient/prigma_logo.jpeg",
    aboutHero: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=400&fit=crop", // Development/Laptop
    aboutTeam: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=200&fit=crop", // Team working on software
    aboutWarehouse: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=200&fit=crop", // Servers/Cloud
  },

  // About page content
  about: {
    heroTitle: "Desarrollo de Software a Medida",
    heroDescription:
      "Soluciones de software personalizadas para transformar tu negocio. Apps web, móviles y sistemas empresariales.",
    storyTitle: "Nuestra Historia",
    storySubtitle: "Más de 3 años de experiencia",
    storyText:
      "PRIGMA nació con la visión de potenciar a las empresas colombianas mediante tecnología de punta. Nos especializamos en entender las necesidades únicas de cada negocio y traducirlas en software robusto, escalable y eficiente.",
    mission:
      "Brindar soluciones de software personalizadas y de alta calidad que impulsen el crecimiento y la transformación digital de nuestros clientes.",
    vision:
      "Ser líderes en el desarrollo de software a medida en Colombia, reconocidos por nuestra innovación, calidad técnica y compromiso con el éxito de cada proyecto.",
    tagline:
      "Tu socio tecnológico para soluciones de software a medida.",
    teamText:
      "Un equipo de ingenieros y diseñadores apasionados por crear productos digitales excepcionales.",
    warehouseText:
      "Infraestructura cloud robusta y segura para desplegar tus aplicaciones.",
    stats: {
      clients: "20+",
      products: "50+",
      years: "3+",
      secure: "100%",
    } as const,
  },
  
  // Features flags
  features: {
    workOrders: true,
  },
} as const;
