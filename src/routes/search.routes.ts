import { Router } from 'express';
import {
  vectorSearch,
  hybridSearch,
  getSimilarProducts,
  getRecommendations,   // ✅ imported
  advancedSearch,
  getTrending, 
} from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/vector', authenticate, vectorSearch);
router.get('/hybrid', authenticate, hybridSearch);
router.get('/similar/:productId', authenticate, getSimilarProducts);
router.get('/recommendations', authenticate, getRecommendations);   // ✅ new route
router.get('/advanced', authenticate, advancedSearch);
router.get('/trending', authenticate, getTrending);

export default router;