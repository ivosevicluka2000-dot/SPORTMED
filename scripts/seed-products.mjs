#!/usr/bin/env node
/**
 * Seed Supabase with the 4 product categories + 15 starter products from
 * the legacy mock catalog. Idempotent — uses upsert by slug.
 *
 * Usage: node scripts/seed-products.mjs
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const categories = [
  {
    slug: "oprema",
    title: { sr: "Oprema", en: "Equipment" },
    description: {
      sr: "Oprema za trening i oporavak",
      en: "Training and recovery equipment",
    },
    sort_order: 1,
  },
  {
    slug: "suplementi",
    title: { sr: "Suplementi", en: "Supplements" },
    description: {
      sr: "Suplementi za oporavak i performanse",
      en: "Recovery and performance supplements",
    },
    sort_order: 2,
  },
  {
    slug: "pomagala",
    title: { sr: "Pomagala", en: "Supports & Braces" },
    description: {
      sr: "Orteze, steznici i pomagala za podršku",
      en: "Orthoses, sleeves and support aids",
    },
    sort_order: 3,
  },
  {
    slug: "besplatni-vodici",
    title: { sr: "Besplatni vodiči", en: "Free Guides" },
    description: {
      sr: "Besplatni PDF vodiči za prevenciju i oporavak",
      en: "Free PDF guides for prevention and recovery",
    },
    sort_order: 4,
  },
];

const categoryKeyToSlug = {
  oprema: "oprema",
  suplementi: "suplementi",
  pomagala: "pomagala",
  vodici: "besplatni-vodici",
};

const products = [
  {
    slug: "kinezioloska-traka",
    categoryKey: "oprema",
    price: 890,
    compare_at_price: 1200,
    stock: 50,
    featured: true,
    product_type: "physical",
    name: { sr: "Kineziolška traka", en: "Kinesiology Tape" },
    description: {
      sr: "Elastična kineziolška traka za podršku mišićima i zglobovima. Vodootporna, hipoalergenska, idealna za sportiste. Dimenzije: 5cm x 5m.",
      en: "Elastic kinesiology tape for muscle and joint support. Waterproof, hypoallergenic, ideal for athletes. Dimensions: 5cm x 5m.",
    },
    often_bought_with_slugs: ["foam-roller", "set-elasticnih-traka"],
  },
  {
    slug: "foam-roller",
    categoryKey: "oprema",
    price: 3490,
    compare_at_price: 4500,
    stock: 25,
    featured: true,
    product_type: "physical",
    name: { sr: "Foam roller za oporavak", en: "Recovery Foam Roller" },
    description: {
      sr: "Roller od visokogustog penuša za samomijofascijalno opuštanje. Pomaže u oporavku mišića, smanjuje upalu i poboljšava cirkulaciju. Dužina: 45cm.",
      en: "High-density foam roller for self-myofascial release. Aids muscle recovery, reduces inflammation and improves circulation. Length: 45cm.",
    },
    often_bought_with_slugs: ["masazni-pistolj", "magnezijum-oporavak"],
  },
  {
    slug: "set-elasticnih-traka",
    categoryKey: "oprema",
    price: 2190,
    stock: 40,
    featured: false,
    product_type: "physical",
    name: { sr: "Set elastičnih traka za vežbanje", en: "Resistance Bands Set" },
    description: {
      sr: "Set od 5 elastičnih traka različitog otpora (ekstra lak do ekstra jak). Idealne za rehabilitaciju, zagrevanje i trening snage.",
      en: "Set of 5 resistance bands with varying resistance (extra light to extra heavy). Ideal for rehabilitation, warm-up and strength training.",
    },
    often_bought_with_slugs: ["kinezioloska-traka", "foam-roller"],
  },
  {
    slug: "krioterapijski-paket",
    categoryKey: "oprema",
    price: 1490,
    stock: 35,
    featured: false,
    product_type: "physical",
    name: {
      sr: "Krioterapijski paket za hladnu terapiju",
      en: "Cold/Hot Therapy Pack",
    },
    description: {
      sr: "Gel paket za hladnu/toplu terapiju. Višekratna upotreba, fleksibilan i pri niskim temperaturama. Idealan za akutne povrede i oporavak.",
      en: "Reusable gel pack for cold/hot therapy. Stays flexible even when frozen. Ideal for acute injuries and post-workout recovery.",
    },
    often_bought_with_slugs: ["kompresivni-steznik-koleno", "ortoza-skocni-zglob"],
  },
  {
    slug: "magnezijum-oporavak",
    categoryKey: "suplementi",
    price: 1890,
    compare_at_price: 2400,
    stock: 60,
    featured: true,
    product_type: "physical",
    name: { sr: "Magnezijum za oporavak mišića", en: "Magnesium Muscle Recovery" },
    description: {
      sr: "Magnezijum citrat u prahu za brži oporavak mišića. Smanjuje grčeve, poboljšava san i podržava nervni sistem. 300g, 60 doza.",
      en: "Magnesium citrate powder for faster muscle recovery. Reduces cramps, improves sleep and supports the nervous system. 300g, 60 servings.",
    },
    often_bought_with_slugs: ["kolagen-zglobovi", "foam-roller"],
  },
  {
    slug: "kolagen-zglobovi",
    categoryKey: "suplementi",
    price: 2990,
    stock: 45,
    featured: false,
    product_type: "physical",
    name: { sr: "Kolagen za zglobove i tetive", en: "Joint & Tendon Collagen" },
    description: {
      sr: "Hidrolizovani kolagen tip II sa vitaminom C za podršku zglobovima, tetivama i hrskavici. 250g, 30 doza. Ukus narandže.",
      en: "Hydrolyzed type II collagen with vitamin C for joint, tendon and cartilage support. 250g, 30 servings. Orange flavor.",
    },
    often_bought_with_slugs: ["magnezijum-oporavak", "kompresivni-steznik-koleno"],
  },
  {
    slug: "kompresivni-steznik-koleno",
    categoryKey: "pomagala",
    price: 2490,
    stock: 30,
    featured: false,
    product_type: "physical",
    name: { sr: "Kompresivni steznik za koleno", en: "Compression Knee Sleeve" },
    description: {
      sr: "Medicinski kompresivni steznik za koleno sa silikonskim prstenom za stabilizaciju patele. Pruža podršku i toplotu. Veličine: S-XL.",
      en: "Medical-grade compression knee sleeve with silicone patellar ring for stabilization. Provides support and warmth. Sizes: S-XL.",
    },
    often_bought_with_slugs: ["ortoza-skocni-zglob", "kinezioloska-traka"],
  },
  {
    slug: "masazni-pistolj",
    categoryKey: "oprema",
    price: 8990,
    compare_at_price: 12000,
    stock: 15,
    featured: true,
    product_type: "physical",
    name: { sr: "Masažni pištolj za duboku masažu", en: "Deep Tissue Massage Gun" },
    description: {
      sr: "Profesionalni masažni pištolj sa 6 nastavaka i 30 brzina. Duboka perkusivna masaža za oporavak mišića. Tihi motor, baterija traje do 6h.",
      en: "Professional massage gun with 6 attachments and 30 speed settings. Deep percussive massage for muscle recovery. Quiet motor, up to 6h battery life.",
    },
    often_bought_with_slugs: ["foam-roller", "magnezijum-oporavak"],
  },
  {
    slug: "ortoza-skocni-zglob",
    categoryKey: "pomagala",
    price: 1990,
    stock: 35,
    featured: false,
    product_type: "physical",
    name: { sr: "Ortoza za skočni zglob", en: "Ankle Support Brace" },
    description: {
      sr: "Ortopedska ortoza za stabilizaciju skočnog zgloba sa podesivim trakama. Pruža podršku nakon uganuća ili operacije. Veličine: S-XL.",
      en: "Orthopedic ankle brace with adjustable straps for stabilization. Provides support after sprains or surgery. Sizes: S-XL.",
    },
    often_bought_with_slugs: ["kompresivni-steznik-koleno", "krioterapijski-paket"],
  },
  {
    slug: "tens-ems-uredjaj",
    categoryKey: "oprema",
    price: 6490,
    compare_at_price: 7990,
    stock: 20,
    featured: false,
    product_type: "physical",
    name: { sr: "TENS/EMS uređaj za elektroterapiju", en: "TENS/EMS Electrotherapy Unit" },
    description: {
      sr: "Prenosivi TENS/EMS uređaj sa 24 programa za ublažavanje bola i stimulaciju mišića. Uključuje 8 elektrodnih jastučića. Punjiva baterija.",
      en: "Portable TENS/EMS unit with 24 programs for pain relief and muscle stimulation. Includes 8 electrode pads. Rechargeable battery.",
    },
    often_bought_with_slugs: ["masazni-pistolj", "foam-roller"],
  },
  // PDFs
  {
    slug: "vodic-prevencija-fudbal",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    product_type: "pdf",
    name: {
      sr: "Vodič za prevenciju fudbalskih povreda",
      en: "Football Injury Prevention Guide",
    },
    description: {
      sr: "Kompletan vodič sa vežbama za prevenciju najčešćih fudbalskih povreda: ACL, hamstring, skočni zglob. Uključuje protokol zagrevanja FIFA 11+.",
      en: "Complete guide with exercises for preventing the most common football injuries: ACL, hamstring, ankle. Includes FIFA 11+ warm-up protocol.",
    },
    often_bought_with_slugs: ["protokol-acl-rehabilitacija", "vodic-trkacko-koleno"],
  },
  {
    slug: "protokol-acl-rehabilitacija",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    product_type: "pdf",
    name: {
      sr: "Protokol rehabilitacije nakon ACL operacije",
      en: "ACL Reconstruction Rehab Protocol",
    },
    description: {
      sr: "Detaljan protokol rehabilitacije po nedeljama nakon rekonstrukcije prednjeg ukrštenog ligamenta. Od operacije do povratka na teren.",
      en: "Detailed week-by-week rehabilitation protocol after anterior cruciate ligament reconstruction. From surgery to return to play.",
    },
    often_bought_with_slugs: ["vodic-prevencija-fudbal", "vodic-istezanje-mobilnost"],
  },
  {
    slug: "vodic-trkacko-koleno",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    product_type: "pdf",
    name: { sr: "Vodič za oporavak trkačkog kolena", en: "Runner's Knee Recovery Guide" },
    description: {
      sr: "Vodič za razumevanje i lečenje sindroma trkačkog kolena (ITB sindrom). Vežbe za jačanje, istezanje i prevenciju recidiva.",
      en: "Guide to understanding and treating runner's knee (ITB syndrome). Strengthening exercises, stretching and recurrence prevention.",
    },
    often_bought_with_slugs: ["vodic-istezanje-mobilnost", "prirucnik-ishrana-oporavak"],
  },
  {
    slug: "prirucnik-ishrana-oporavak",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    product_type: "pdf",
    name: {
      sr: "Priručnik za ishranu i oporavak sportista",
      en: "Athlete Nutrition & Recovery Handbook",
    },
    description: {
      sr: "Priručnik o nutritivnim strategijama za brži oporavak: anti-inflamatorni režim ishrane, tajming suplemenata, hidracija i planovi obroka.",
      en: "Handbook on nutritional strategies for faster recovery: anti-inflammatory diet, supplement timing, hydration and meal plans.",
    },
    often_bought_with_slugs: ["magnezijum-oporavak", "kolagen-zglobovi"],
  },
  {
    slug: "vodic-istezanje-mobilnost",
    categoryKey: "vodici",
    price: 0,
    stock: 999,
    featured: false,
    product_type: "pdf",
    name: {
      sr: "Kompletni vodič za istezanje i mobilnost",
      en: "Complete Stretching & Mobility Guide",
    },
    description: {
      sr: "50+ vežbi istezanja i mobilnosti za celo telo. Organizovano po delovima tela sa ilustracijama i preporukama za trajanje.",
      en: "50+ stretching and mobility exercises for the whole body. Organized by body part with illustrations and duration recommendations.",
    },
    often_bought_with_slugs: ["foam-roller", "set-elasticnih-traka"],
  },
];

async function main() {
  console.log("Seeding categories…");
  const { data: catRows, error: catErr } = await supabase
    .from("product_categories")
    .upsert(categories, { onConflict: "slug" })
    .select("id, slug");
  if (catErr) throw catErr;
  const catIdBySlug = new Map(catRows.map((c) => [c.slug, c.id]));

  console.log(`Inserted/updated ${catRows.length} categories.`);

  console.log("Seeding products (pass 1: without often_bought_with)…");
  const productRows = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    images: [],
    price: p.price,
    compare_at_price: p.compare_at_price ?? null,
    category_id: catIdBySlug.get(categoryKeyToSlug[p.categoryKey]),
    stock: p.stock,
    featured: p.featured,
    active: true,
    product_type: p.product_type,
  }));
  const { data: prodRows, error: prodErr } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "slug" })
    .select("id, slug");
  if (prodErr) throw prodErr;
  const prodIdBySlug = new Map(prodRows.map((p) => [p.slug, p.id]));
  console.log(`Inserted/updated ${prodRows.length} products.`);

  console.log("Linking often_bought_with…");
  for (const p of products) {
    const ids = (p.often_bought_with_slugs ?? [])
      .map((s) => prodIdBySlug.get(s))
      .filter(Boolean);
    const id = prodIdBySlug.get(p.slug);
    if (!id) continue;
    const { error } = await supabase
      .from("products")
      .update({ often_bought_with: ids })
      .eq("id", id);
    if (error) throw error;
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
