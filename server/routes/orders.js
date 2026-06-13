import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { authMiddleware, recordAction } from '../auth.js';

const router = Router();

function serializeOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name || null,
    customerLocation: row.customer_location || null,
    productId: row.product_id,
    productName: row.product_name || null,
    productImg: row.product_img || null,
    qty: row.qty,
    total: Number(row.total),
    status: row.status,
    transportId: row.transport_id,
    transporterName: row.transporter_name || null,
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : 0,
    date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null,
  };
}

const ENRICHED_SELECT = `
  SELECT o.*,
         p.name AS product_name, p.img AS product_img,
         c.name AS customer_name, c.location AS customer_location,
         t.name AS transporter_name
  FROM orders o
  LEFT JOIN products p ON p.id = o.product_id
  LEFT JOIN users c ON c.id = o.customer_id
  LEFT JOIN users t ON t.id = o.transport_id
`;

// GET /api/orders/customer  — orders placed by the logged-in customer
router.get('/customer', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(`${ENRICHED_SELECT} WHERE o.customer_id = $1 ORDER BY o.created_at DESC`, [req.user.id]);
    res.json({ success: true, orders: rows.map(serializeOrder) });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/supplier  — orders for products owned by the logged-in supplier
router.get('/supplier', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${ENRICHED_SELECT} WHERE o.product_id IN (SELECT id FROM products WHERE supplier_id = $1) ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    res.json({ success: true, orders: rows.map(serializeOrder) });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders  — place an order (one row per cart item)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' });
    }

    const created = await withTransaction(async (client) => {
      const result = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const qty = Number(item.qty);
        if (!productId || !qty || qty <= 0) {
          throw Object.assign(new Error('Invalid cart item.'), { statusCode: 400 });
        }
        const { rows: prodRows } = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = prodRows[0];
        if (!product) {
          throw Object.assign(new Error(`Product ${productId} not found.`), { statusCode: 404 });
        }
        const total = Number(product.price) * qty;
        const { rows: orderRows } = await client.query(
          `INSERT INTO orders (customer_id, product_id, qty, total, status)
           VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
          [req.user.id, productId, qty, total],
        );
        result.push(orderRows[0]);
      }
      return result;
    });

    await recordAction(req.user.id, 'place_order', {
      orderIds: created.map((o) => o.id),
      total: created.reduce((a, o) => a + Number(o.total), 0),
    });
    res.status(201).json({ success: true, orders: created.map(serializeOrder) });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    next(error);
  }
});

export default router;
