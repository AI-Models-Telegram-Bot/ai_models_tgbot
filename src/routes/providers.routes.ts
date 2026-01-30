import express from 'express';
import { ModelCategory } from '@prisma/client';
import { getProviderManager } from '../config/providerFactory';

const router = express.Router();

/**
 * GET /api/providers/stats
 * Get all provider statistics across all categories
 */
router.get('/providers/stats', (req, res) => {
  try {
    const manager = getProviderManager();
    const stats = manager.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/stats/:category
 * Get provider statistics for a specific category
 */
router.get('/providers/stats/:category', (req, res) => {
  try {
    const category = req.params.category.toUpperCase() as ModelCategory;
    if (!['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be TEXT, IMAGE, VIDEO, or AUDIO' });
    }

    const manager = getProviderManager();
    const stats = manager.getStats(category);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/cost/:category
 * Get cost comparison for a category (sorted by avg cost, cheapest first)
 */
router.get('/providers/cost/:category', (req, res) => {
  try {
    const category = req.params.category.toUpperCase() as ModelCategory;
    if (!['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be TEXT, IMAGE, VIDEO, or AUDIO' });
    }

    const manager = getProviderManager();
    const comparison = manager.getCostComparison(category);
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/recommended/:category
 * Get the recommended provider for a category (cheapest with >80% success rate)
 */
router.get('/providers/recommended/:category', (req, res) => {
  try {
    const category = req.params.category.toUpperCase() as ModelCategory;
    if (!['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be TEXT, IMAGE, VIDEO, or AUDIO' });
    }

    const manager = getProviderManager();
    const recommended = manager.getRecommended(category);
    res.json({ recommended });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
