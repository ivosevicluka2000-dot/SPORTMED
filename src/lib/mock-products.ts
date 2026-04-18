import type { Product, ProductCategory } from "@/types";

// ——— Mock Categories ———

export const mockCategories: Record<string, ProductCategory> = {
  oprema: {
    _id: "cat-oprema",
    title: "", // set per locale
    slug: "oprema",
    description: "",
  },
  suplementi: {
    _id: "cat-suplementi",
    title: "",
    slug: "suplementi",
    description: "",
  },
  pomagala: {
    _id: "cat-pomagala",
    title: "",
    slug: "pomagala",
    description: "",
  },
  vodici: {
    _id: "cat-vodici",
    title: "",
    slug: "besplatni-vodici",
    description: "",
  },
};

const categoryTranslations: Record<
  string,
  { sr: { title: string; description: string }; en: { title: string; description: string } }
> = {
  oprema: {
    sr: { title: "Oprema", description: "Oprema za trening i oporavak" },
    en: { title: "Equipment", description: "Training and recovery equipment" },
  },
  suplementi: {
    sr: { title: "Suplementi", description: "Suplementi za oporavak i performanse" },
    en: { title: "Supplements", description: "Recovery and performance supplements" },
  },
  pomagala: {
    sr: { title: "Pomagala", description: "Orteze, steznici i pomagala za podršku" },
    en: { title: "Supports & Braces", description: "Orthoses, sleeves and support aids" },
  },
  vodici: {
    sr: { title: "Besplatni vodiči", description: "Besplatni PDF vodiči za prevenciju i oporavak" },
    en: { title: "Free Guides", description: "Free PDF guides for prevention and recovery" },
  },
};

export function getMockCategories(locale: string): ProductCategory[] {
  return Object.entries(mockCategories).map(([key, cat]) => ({
    ...cat,
    title: categoryTranslations[key]?.[locale as "sr" | "en"]?.title ?? cat.title,
    description: categoryTranslations[key]?.[locale as "sr" | "en"]?.description ?? cat.description,
  }));
}

// ——— Product translations ———

interface ProductTranslation {
  name: string;
  description: string;
}

const productTranslations: Record<string, { sr: ProductTranslation; en: ProductTranslation }> = {
  "kinezioloska-traka": {
    sr: {
      name: "Kineziolška traka",
      description:
        "Elastična kineziolška traka za podršku mišićima i zglobovima. Vodootporna, hipoalergenska, idealna za sportiste. Dimenzije: 5cm x 5m.",
    },
    en: {
      name: "Kinesiology Tape",
      description:
        "Elastic kinesiology tape for muscle and joint support. Waterproof, hypoallergenic, ideal for athletes. Dimensions: 5cm x 5m.",
    },
  },
  "foam-roller": {
    sr: {
      name: "Foam roller za oporavak",
      description:
        "Roller od visokogustog penuša za samomijofascijalno opuštanje. Pomaže u oporavku mišića, smanjuje upalu i poboljšava cirkulaciju. Dužina: 45cm.",
    },
    en: {
      name: "Recovery Foam Roller",
      description:
        "High-density foam roller for self-myofascial release. Aids muscle recovery, reduces inflammation and improves circulation. Length: 45cm.",
    },
  },
  "set-elasticnih-traka": {
    sr: {
      name: "Set elastičnih traka za vežbanje",
      description:
        "Set od 5 elastičnih traka različitog otpora (ekstra lak do ekstra jak). Idealne za rehabilitaciju, zagrevanje i trening snage.",
    },
    en: {
      name: "Resistance Bands Set",
      description:
        "Set of 5 resistance bands with varying resistance (extra light to extra heavy). Ideal for rehabilitation, warm-up and strength training.",
    },
  },
  "krioterapijski-paket": {
    sr: {
      name: "Krioterapijski paket za hladnu terapiju",
      description:
        "Gel paket za hladnu/toplu terapiju. Višekratna upotreba, fleksibilan i pri niskim temperaturama. Idealan za akutne povrede i oporavak.",
    },
    en: {
      name: "Cold/Hot Therapy Pack",
      description:
        "Reusable gel pack for cold/hot therapy. Stays flexible even when frozen. Ideal for acute injuries and post-workout recovery.",
    },
  },
  "magnezijum-oporavak": {
    sr: {
      name: "Magnezijum za oporavak mišića",
      description:
        "Magnezijum citrat u prahu za brži oporavak mišića. Smanjuje grčeve, poboljšava san i podržava nervni sistem. 300g, 60 doza.",
    },
    en: {
      name: "Magnesium Muscle Recovery",
      description:
        "Magnesium citrate powder for faster muscle recovery. Reduces cramps, improves sleep and supports the nervous system. 300g, 60 servings.",
    },
  },
  "kolagen-zglobovi": {
    sr: {
      name: "Kolagen za zglobove i tetive",
      description:
        "Hidrolizovani kolagen tip II sa vitaminom C za podršku zglobovima, tetivama i hrskavici. 250g, 30 doza. Ukus narandže.",
    },
    en: {
      name: "Joint & Tendon Collagen",
      description:
        "Hydrolyzed type II collagen with vitamin C for joint, tendon and cartilage support. 250g, 30 servings. Orange flavor.",
    },
  },
  "kompresivni-steznik-koleno": {
    sr: {
      name: "Kompresivni steznik za koleno",
      description:
        "Medicinski kompresivni steznik za koleno sa silikonskim prstenom za stabilizaciju patele. Pruža podršku i toplotu. Veličine: S-XL.",
    },
    en: {
      name: "Compression Knee Sleeve",
      description:
        "Medical-grade compression knee sleeve with silicone patellar ring for stabilization. Provides support and warmth. Sizes: S-XL.",
    },
  },
  "masazni-pistolj": {
    sr: {
      name: "Masažni pištolj za duboku masažu",
      description:
        "Profesionalni masažni pištolj sa 6 nastavaka i 30 brzina. Duboka perkusivna masaža za oporavak mišića. Tihi motor, baterija traje do 6h.",
    },
    en: {
      name: "Deep Tissue Massage Gun",
      description:
        "Professional massage gun with 6 attachments and 30 speed settings. Deep percussive massage for muscle recovery. Quiet motor, up to 6h battery life.",
    },
  },
  "ortoza-skocni-zglob": {
    sr: {
      name: "Ortoza za skočni zglob",
      description:
        "Ortopedska ortoza za stabilizaciju skočnog zgloba sa podesivim trakama. Pruža podršku nakon uganuća ili operacije. Veličine: S-XL.",
    },
    en: {
      name: "Ankle Support Brace",
      description:
        "Orthopedic ankle brace with adjustable straps for stabilization. Provides support after sprains or surgery. Sizes: S-XL.",
    },
  },
  "tens-ems-uredjaj": {
    sr: {
      name: "TENS/EMS uređaj za elektroterapiju",
      description:
        "Prenosivi TENS/EMS uređaj sa 24 programa za ublažavanje bola i stimulaciju mišića. Uključuje 8 elektrodnih jastučića. Punjiva baterija.",
    },
    en: {
      name: "TENS/EMS Electrotherapy Unit",
      description:
        "Portable TENS/EMS unit with 24 programs for pain relief and muscle stimulation. Includes 8 electrode pads. Rechargeable battery.",
    },
  },
  // ——— Free PDF Guides ———
  "vodic-prevencija-fudbal": {
    sr: {
      name: "Vodič za prevenciju fudbalskih povreda",
      description:
        "Kompletan vodič sa vežbama za prevenciju najčešćih fudbalskih povreda: ACL, hamstring, skočni zglob. Uključuje protokol zagrevanja FIFA 11+.",
    },
    en: {
      name: "Football Injury Prevention Guide",
      description:
        "Complete guide with exercises for preventing the most common football injuries: ACL, hamstring, ankle. Includes FIFA 11+ warm-up protocol.",
    },
  },
  "protokol-acl-rehabilitacija": {
    sr: {
      name: "Protokol rehabilitacije nakon ACL operacije",
      description:
        "Detaljan protokol rehabilitacije po nedeljama nakon rekonstrukcije prednjeg ukrštenog ligamenta. Od operacije do povratka na teren.",
    },
    en: {
      name: "ACL Reconstruction Rehab Protocol",
      description:
        "Detailed week-by-week rehabilitation protocol after anterior cruciate ligament reconstruction. From surgery to return to play.",
    },
  },
  "vodic-trkacko-koleno": {
    sr: {
      name: "Vodič za oporavak trkačkog kolena",
      description:
        "Vodič za razumevanje i lečenje sindroma trkačkog kolena (ITB sindrom). Vežbe za jačanje, istezanje i prevenciju recidiva.",
    },
    en: {
      name: "Runner's Knee Recovery Guide",
      description:
        "Guide to understanding and treating runner's knee (ITB syndrome). Strengthening exercises, stretching and recurrence prevention.",
    },
  },
  "prirucnik-ishrana-oporavak": {
    sr: {
      name: "Priručnik za ishranu i oporavak sportista",
      description:
        "Priručnik o nutritivnim strategijama za brži oporavak: anti-inflamatorni režim ishrane, tajming suplemenata, hidracija i planovi obroka.",
    },
    en: {
      name: "Athlete Nutrition & Recovery Handbook",
      description:
        "Handbook on nutritional strategies for faster recovery: anti-inflammatory diet, supplement timing, hydration and meal plans.",
    },
  },
  "vodic-istezanje-mobilnost": {
    sr: {
      name: "Kompletni vodič za istezanje i mobilnost",
      description:
        "50+ vežbi istezanja i mobilnosti za celo telo. Organizovano po delovima tela sa ilustracijama i preporukama za trajanje.",
    },
    en: {
      name: "Complete Stretching & Mobility Guide",
      description:
        "50+ stretching and mobility exercises for the whole body. Organized by body part with illustrations and duration recommendations.",
    },
  },
};

// ——— Mock Products ———

interface MockProductData {
  slug: string;
  categoryKey: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured: boolean;
  type: "physical" | "pdf";
  oftenBoughtWith: string[];
}

const mockProductData: MockProductData[] = [
  // Physical products
  {
    slug: "kinezioloska-traka",
    categoryKey: "oprema",
    price: 890,
    compareAtPrice: 1200,
    stock: 50,
    featured: true,
    type: "physical",
    oftenBoughtWith: ["foam-roller", "set-elasticnih-traka"],
  },
  {
    slug: "foam-roller",
    categoryKey: "oprema",
    price: 3490,
    compareAtPrice: 4500,
    stock: 25,
    featured: true,
    type: "physical",
    oftenBoughtWith: ["masazni-pistolj", "magnezijum-oporavak"],
  },
  {
    slug: "set-elasticnih-traka",
    categoryKey: "oprema",
    price: 2190,
    stock: 40,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["kinezioloska-traka", "foam-roller"],
  },
  {
    slug: "krioterapijski-paket",
    categoryKey: "oprema",
    price: 1490,
    stock: 35,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["kompresivni-steznik-koleno", "ortoza-skocni-zglob"],
  },
  {
    slug: "magnezijum-oporavak",
    categoryKey: "suplementi",
    price: 1890,
    compareAtPrice: 2400,
    stock: 60,
    featured: true,
    type: "physical",
    oftenBoughtWith: ["kolagen-zglobovi", "foam-roller"],
  },
  {
    slug: "kolagen-zglobovi",
    categoryKey: "suplementi",
    price: 2990,
    stock: 45,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["magnezijum-oporavak", "kompresivni-steznik-koleno"],
  },
  {
    slug: "kompresivni-steznik-koleno",
    categoryKey: "pomagala",
    price: 2490,
    stock: 30,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["ortoza-skocni-zglob", "kinezioloska-traka"],
  },
  {
    slug: "masazni-pistolj",
    categoryKey: "oprema",
    price: 8990,
    compareAtPrice: 12000,
    stock: 15,
    featured: true,
    type: "physical",
    oftenBoughtWith: ["foam-roller", "magnezijum-oporavak"],
  },
  {
    slug: "ortoza-skocni-zglob",
    categoryKey: "pomagala",
    price: 1990,
    stock: 35,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["kompresivni-steznik-koleno", "krioterapijski-paket"],
  },
  {
    slug: "tens-ems-uredjaj",
    categoryKey: "oprema",
    price: 6490,
    compareAtPrice: 7990,
    stock: 20,
    featured: false,
    type: "physical",
    oftenBoughtWith: ["masazni-pistolj", "foam-roller"],
  },
  // Free PDF guides
  {
    slug: "vodic-prevencija-fudbal",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    type: "pdf",
    oftenBoughtWith: ["protokol-acl-rehabilitacija", "vodic-trkacko-koleno"],
  },
  {
    slug: "protokol-acl-rehabilitacija",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    type: "pdf",
    oftenBoughtWith: ["vodic-prevencija-fudbal", "vodic-istezanje-mobilnost"],
  },
  {
    slug: "vodic-trkacko-koleno",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    type: "pdf",
    oftenBoughtWith: ["vodic-istezanje-mobilnost", "prirucnik-ishrana-oporavak"],
  },
  {
    slug: "prirucnik-ishrana-oporavak",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    type: "pdf",
    oftenBoughtWith: ["magnezijum-oporavak", "kolagen-zglobovi"],
  },
  {
    slug: "vodic-istezanje-mobilnost",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    type: "pdf",
    oftenBoughtWith: ["foam-roller", "set-elasticnih-traka"],
  },
];

export function getMockProducts(locale: string): Product[] {
  return mockProductData
    .map((data) => {
      const t = productTranslations[data.slug]?.[locale as "sr" | "en"];
      if (!t) return null;

      const catTrans = categoryTranslations[data.categoryKey]?.[locale as "sr" | "en"];

      return {
        _id: `mock-${data.slug}`,
        name: t.name,
        slug: data.slug,
        description: t.description,
        images: [],
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        category: {
          _id: `cat-${data.categoryKey}`,
          title: catTrans?.title ?? data.categoryKey,
          slug: mockCategories[data.categoryKey]?.slug ?? data.categoryKey,
        },
        stock: data.stock,
        featured: data.featured,
        active: true,
        type: data.type,
        oftenBoughtWith: data.oftenBoughtWith,
      } as Product;
    })
    .filter(Boolean) as Product[];
}

export function getMockProduct(locale: string, slug: string): Product | null {
  const products = getMockProducts(locale);
  return products.find((p) => p.slug === slug) ?? null;
}

export function getMockProductSlugs(): { slug: string }[] {
  return mockProductData.map((d) => ({ slug: d.slug }));
}

export function getMockRelatedProducts(locale: string, slugs: string[]): Product[] {
  const allProducts = getMockProducts(locale);
  return allProducts.filter((p) => slugs.includes(p.slug));
}
