import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_PRODUCTS = [
  { name: 'Hybrid Maize Seed (SC403)', category: 'Seeds', price: 285, unit: '25kg bag', stock: 120, season: 'Nov–Jan', predicted_avail: 'Oct 2026', predicted_price: 310, demand: 'High', img: '🌽', image: 'https://images.unsplash.com/photo-1511479744931-3a5d3d5a0ce4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Soybean Seed (Hernon 147)', category: 'Seeds', price: 320, unit: '25kg bag', stock: 80, season: 'Nov–Dec', predicted_avail: 'Oct 2026', predicted_price: 340, demand: 'Medium', img: '🫘', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80' },
  { name: 'D-Compound Fertilizer', category: 'Fertilizer', price: 450, unit: '50kg bag', stock: 200, season: 'All year', predicted_avail: 'Now', predicted_price: 470, demand: 'High', img: '🧪', image: 'https://images.unsplash.com/photo-1524594164608-9b1f890cd1bf?auto=format&fit=crop&w=800&q=80' },
  { name: 'Urea (Nitrogen Top Dressing)', category: 'Fertilizer', price: 380, unit: '50kg bag', stock: 150, season: 'All year', predicted_avail: 'Now', predicted_price: 395, demand: 'Medium', img: '⚗️', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80' },
  { name: 'Groundnut Seed (Chalimbana)', category: 'Seeds', price: 220, unit: '20kg bag', stock: 60, season: 'Nov–Dec', predicted_avail: 'Sep 2026', predicted_price: 250, demand: 'Low', img: '🥜', image: 'https://images.unsplash.com/photo-1524594164608-9b1f890cd1bf?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tomato Seedlings (Money Maker)', category: 'Seedlings', price: 150, unit: 'tray of 50', stock: 40, season: 'Apr–Jun', predicted_avail: 'Mar 2027', predicted_price: 165, demand: 'High', img: '🍅', image: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80' },
];

const SEED_CROPS = [
  { name: 'Maize', soil: 'Loamy, well-drained', season: 'Nov–Jan', spacing: '75cm × 25cm', fertilizer: 'D-Compound + Urea', disease: 'Streak Virus, Stalk Borer', yield_range: '4–8 t/ha', harvest: 'Apr–May', img: '🌽', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80' },
  { name: 'Soybeans', soil: 'Sandy loam, pH 6–6.5', season: 'Nov–Dec', spacing: '45cm × 5cm', fertilizer: 'Rhizobium inoculant', disease: 'Rust, Mosaic Virus', yield_range: '1.5–3 t/ha', harvest: 'Mar–Apr', img: '🫘', image: 'https://images.unsplash.com/photo-1510639403341-7d16d53f7f04?auto=format&fit=crop&w=800&q=80' },
  { name: 'Groundnuts', soil: 'Sandy loam, well-drained', season: 'Nov–Dec', spacing: '45cm × 15cm', fertilizer: 'Low N, P-rich', disease: 'Rosette, Leaf Spot', yield_range: '0.8–1.5 t/ha', harvest: 'Mar–Apr', img: '🥜', image: 'https://images.unsplash.com/photo-1490276481064-6e8c91b40aaf?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tomatoes', soil: 'Rich loam, pH 6–6.8', season: 'Apr–Jun (dry)', spacing: '60cm × 45cm', fertilizer: 'High K + Ca', disease: 'Blight, Bacterial Wilt', yield_range: '20–40 t/ha', harvest: 'Jul–Sep', img: '🍅', image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80' },
];

const SEED_POSTS = [
  { author: 'Agri Expert', role: 'expert', text: 'Use compost to improve soil structure.', likes: 12 },
  { author: 'Supplier Network', role: 'supplier', text: 'Selling quality maize seed this season.', likes: 5 },
];

async function runSchema() {
  const sql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(sql);
  console.log('Schema applied.');
}

async function seed() {
  const { rows: productCount } = await query('SELECT COUNT(*)::int AS n FROM products');
  if (productCount[0].n === 0) {
    for (const p of SEED_PRODUCTS) {
      await query(
        `INSERT INTO products (name, supplier_id, category, price, unit, stock, season, predicted_avail, predicted_price, demand, img, image)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [p.name, p.category, p.price, p.unit, p.stock, p.season, p.predicted_avail, p.predicted_price, p.demand, p.img, p.image],
      );
    }
    console.log(`Seeded ${SEED_PRODUCTS.length} products.`);
  } else {
    console.log('Products already present, skipping product seed.');
  }

  const { rows: cropCount } = await query('SELECT COUNT(*)::int AS n FROM crop_data');
  if (cropCount[0].n === 0) {
    for (const c of SEED_CROPS) {
      await query(
        `INSERT INTO crop_data (name, soil, season, spacing, fertilizer, disease, yield_range, harvest, img, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [c.name, c.soil, c.season, c.spacing, c.fertilizer, c.disease, c.yield_range, c.harvest, c.img, c.image],
      );
    }
    console.log(`Seeded ${SEED_CROPS.length} crops.`);
  } else {
    console.log('Crops already present, skipping crop seed.');
  }

  const { rows: postCount } = await query('SELECT COUNT(*)::int AS n FROM community_posts');
  if (postCount[0].n === 0) {
    for (const p of SEED_POSTS) {
      await query(
        `INSERT INTO community_posts (user_id, author, role, text, likes) VALUES (NULL, $1, $2, $3, $4)`,
        [p.author, p.role, p.text, p.likes],
      );
    }
    console.log(`Seeded ${SEED_POSTS.length} community posts.`);
  } else {
    console.log('Community posts already present, skipping post seed.');
  }
}

async function main() {
  try {
    await runSchema();
    // Always run seed (idempotent): only inserts when tables are empty.
    await seed();
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
