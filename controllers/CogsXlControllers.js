const CogsXl = require('../models/CogsXl');

// Helper: pick only allowed fields (exact Excel names)
const pickAllowed = (body) => {
  const allowed = [
    'Sr',
    'WeekPeriod',
    'Period',
    'Week ',
    'StoreNumber',
    'StoreName',
    'ARL',
    'ReportingHead ',
    'Sales2025 ',
    'Sales2024',
    'CustomerCount2025',
    'CustomerCount2024',
    'FoodcostBlueline',
    'Pepsico',
    'TotalFoodCost',
    'FoodCostpercent',
    'FourWeekFoodCost',
    'Wages',
    'Wagespercent',
    'FourWeekWageCost',
    'FoodAndLaborPercent',
    'FourWeekAverageFoodAndLabor'
  ];

  const out = {};
  for (const k of allowed) {
    if (k in body) out[k] = body[k]; // keep original type/value
  }
  return out;
};

// Create one
exports.createCogsXl = async (req, res) => {
  try {
    const data = pickAllowed(req.body);
    const doc = await CogsXl.create(data);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Bulk insert
exports.bulkInsertCogsXl = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array' });
    }
    const docs = await CogsXl.insertMany(req.body.map(pickAllowed), { ordered: false });
    res.status(201).json({ inserted: docs.length, docs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all with search + pagination
exports.getCogsXl = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { $text: { $search: search } } : {};
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CogsXl.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      CogsXl.countDocuments(query)
    ]);
    res.json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get by ID
exports.getCogsXlById = async (req, res) => {
  try {
    const doc = await CogsXl.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updateCogsXl = async (req, res) => {
  try {
    const doc = await CogsXl.findByIdAndUpdate(
      req.params.id,
      pickAllowed(req.body),
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteCogsXl = async (req, res) => {
  try {
    const doc = await CogsXl.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true, id: doc._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
