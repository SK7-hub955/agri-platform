import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function serializeCrop(row) {
  return {
    name: row.name,
    soil: row.soil,
    season: row.season,
    spacing: row.spacing,
    fertilizer: row.fertilizer,
    disease: row.disease,
    yield: row.yield_range,
    harvest: row.harvest,
    img: row.img,
    image: row.image,
  };
}

// GET /api/crops  (public)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM crop_data ORDER BY id');
    res.json({ success: true, crops: rows.map(serializeCrop) });
  } catch (error) {
    next(error);
  }
});

export default router;
