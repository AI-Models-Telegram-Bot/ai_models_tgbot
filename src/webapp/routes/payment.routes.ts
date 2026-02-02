import { Router } from 'express';

const router = Router();

/**
 * POST /api/webapp/payment/create
 * Stub - payment integration will be added in Phase 4.
 */
router.post('/payment/create', (_req, res) => {
  return res.status(501).json({ message: 'Payment integration not yet implemented' });
});

/**
 * POST /api/webapp/payment/verify
 * Stub - payment verification will be added in Phase 4.
 */
router.post('/payment/verify', (_req, res) => {
  return res.status(501).json({ message: 'Payment verification not yet implemented' });
});

export default router;
