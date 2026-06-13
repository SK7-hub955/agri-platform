import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, requireRole, recordAction } from '../auth.js';

const router = Router();

export function serializeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name || null,
    category: row.category,
    price: Number(row.price),
    unit: row.unit,
    stock: row.stock,
    season: row.season,
    predictedAvail: row.predicted_avail,
    predictedPrice: row.predicted_price != null ? Number(row.predicted_price) : null,
    demand: row.demand,
    img: row.img,
    image: row.image,
  };
}

// GET /api/products  (public)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, u.name AS supplier_name
       FROM products p
       LEFT JOIN users u ON u.id = p.supplier_id
       ORDER BY p.id`,
    );
    res.json({ success: true, products: rows.map(serializeProduct) });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/mine  (supplier)
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, u.name AS supplier_name
       FROM products p LEFT JOIN users u ON u.id = p.supplier_id
       WHERE p.supplier_id = $1 ORDER BY p.id`,
      [req.user.id],
    );
    res.json({ success: true, products: rows.map(serializeProduct) });
  } catch (error) {
    next(error);
  }
});

// POST /api/products  (supplier)
router.post('/', authMiddleware, requireRole('supplier'), async (req, res, next) => {
  try {
    const { name, category, price, unit, stock, season } = req.body || {};
    if (!name || price == null || price === '') {
      return res.status(400).json({ success: false, error: 'Product name and price are required.' });
    }
    const numericPrice = Number(price);
    const numericStock = Number(stock) || 0;
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ success: false, error: 'Price must be a non-negative number.' });
    }
    const { rows } = await query(
      `INSERT INTO products (name, supplier_id, category, price, unit, stock, season, predicted_avail, predicted_price, demand, img)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'TBD', $8, 'Medium', '📦') RETURNING *`,
      [name, req.user.id, category || 'Produce', numericPrice, unit || '', numericStock, season || '', numericPrice * 1.05],
    );
    await recordAction(req.user.id, 'add_product', { productId: rows[0].id, name, price: numericPrice });
    res.status(201).json({ success: true, product: serializeProduct(rows[0]) });
  } catch (error) {
    next(error);
  }
});

export default router;
