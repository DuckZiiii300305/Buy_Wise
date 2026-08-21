import { Router } from 'express';
import { AnalysisService } from '../services/analysis.service.js';
import { errMsg } from '../utils/errors.js';

export const analysisRouter = Router();

// GET /api/analyses - Get all analyses
analysisRouter.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const analyses = await AnalysisService.getAllAnalyses(limit);
    res.json({ success: true, data: analyses });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});

// GET /api/analyses/:id - Get analysis by ID
analysisRouter.get('/:id', async (req, res) => {
  try {
    const analysis = await AnalysisService.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});

// POST /api/analyses - Create analysis
analysisRouter.post('/', async (req, res) => {
  try {
    const { productId, userId, currentPrice, verdict, score, confidence, reasoning, evidences, reviews, alternatives } = req.body;
    if (!productId || !verdict) {
      return res.status(400).json({ success: false, error: 'productId and verdict are required' });
    }

    const analysis = await AnalysisService.createAnalysis({
      productId,
      userId,
      currentPrice,
      verdict,
      score,
      confidence,
      reasoning,
      evidences,
      reviews,
      alternatives,
    });

    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: errMsg(error) });
  }
});
