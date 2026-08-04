import { Router } from 'express';
import {
  downloadSalesReport,
  downloadInventoryReport,
  downloadUserAnalyticsReport,
  generateReportAsync,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/sales', downloadSalesReport);
router.get('/inventory', downloadInventoryReport);
router.get('/users', downloadUserAnalyticsReport);
router.post('/async', generateReportAsync);

export default router;