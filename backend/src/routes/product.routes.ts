import { Router } from 'express';
import { ProductService } from '../services/product.service.js';
import { ProductUnderstandingService } from '../services/product-understanding.service.js';
import { validateUnderstand } from '../middleware/validate.js';
import { errMsg } from '../utils/errors.js';

export const productRouter = Router();

// GET /api/products - Get recent products
productRouter.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const products = await ProductService.getRecentProducts(limit);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});

// GET /api/products/:id - Get product by ID
productRouter.get('/:id', async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});

// POST /api/products - Create a new product entry manually
productRouter.post('/', async (req, res) => {
  try {
    const { rawInput, brand, model, category, variant, normalizedJson } = req.body;
    if (!rawInput) {
      return res.status(400).json({ success: false, error: 'rawInput is required' });
    }
    const product = await ProductService.createProduct({
      rawInput,
      brand,
      model,
      category,
      variant,
      normalizedJson,
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});

// POST /api/products/understand - Analyze & understand product using Gemini AI
productRouter.post('/understand', validateUnderstand, async (req, res) => {
  try {
    const { rawInput, budget, purpose, priorities } = req.body;

    const parsedBudget = budget ? parseFloat(String(budget).replace(/[^0-9.]/g, '')) : undefined;
    const parsedPriorities = Array.isArray(priorities) ? priorities.map(String).filter(Boolean) : [];
    const result = await ProductUnderstandingService.processProductInput(rawInput, parsedBudget, purpose, parsedPriorities);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});
