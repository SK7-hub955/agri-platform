import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, recordAction } from '../auth.js';

const router = Router();

// Map an order's status to the transporter-facing delivery status.
function deliveryStatus(orderStatus) {
  if (orderStatus === 'Delivered') return 'Completed';
  if (orderStatus === 'In Transit') return 'In Progress';
  return orderStatus;
}

function serializeAvailable(row) {
  return {
    id: row.id,
    status: row.status,
    qty: row.qty,
    productName: row.product_name,
    productImg: row.product_img,
    customerName: row.customer_name,
    customerLocation: row.customer_location,
    deliveryFee: Number(row.delivery_fee),
    date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null,
  };
}

function serializeDelivery(row) {
  return {
    id: row.id,
    from: 'Chisamba',
    to: row.customer_location || 'Customer',
    distance: 'N/A',
    fee: Number(row.delivery_fee),
    status: deliveryStatus(row.status),
  };
}

// GET /api/deliveries/available — unassigned / pending orders
router.get('/available', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, p.name AS product_name, p.img AS product_img,
              c.name AS customer_name, c.location AS customer_location
       FROM orders o
       LEFT JOIN products p ON p.id = o.product_id
       LEFT JOIN users c ON c.id = o.customer_id
       WHERE o.transport_id IS NULL OR o.status = 'Pending'
       ORDER BY o.created_at DESC`,
    );
    res.json({ success: true, deliveries: rows.map(serializeAvailable) });
  } catch (error) {
    next(error);
  }
});

// GET /api/deliveries/mine — deliveries assigned to the logged-in transporter
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, c.location AS customer_location
       FROM orders o LEFT JOIN users c ON c.id = o.customer_id
       WHERE o.transport_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    res.json({ success: true, deliveries: rows.map(serializeDelivery) });
  } catch (error) {
    next(error);
  }
});

// POST /api/deliveries/:orderId/accept
router.post('/:orderId/accept', authMiddleware, async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const { rows } = await query(
      `UPDATE orders SET transport_id = $1, status = 'In Transit'
       WHERE id = $2 AND (transport_id IS NULL OR status = 'Pending')
       RETURNING *`,
      [req.user.id, orderId],
    );
    if (rows.length === 0) {
      return res.status(409).json({ success: false, error: 'Order is no longer available.' });
    }
    await recordAction(req.user.id, 'accept_delivery', { orderId });
    res.json({ success: true, order: { id: rows[0].id, status: rows[0].status } });
  } catch (error) {
    next(error);
  }
});

export default router;
