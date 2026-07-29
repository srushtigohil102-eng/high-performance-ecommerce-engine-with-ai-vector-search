import { Router } from "express";
import { addEmailJob, getQueueStatus, clearQueue } from "../controllers/queue.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post("/email", addEmailJob);
router.get("/status", getQueueStatus);
router.delete("/:queueName", clearQueue);

export default router;