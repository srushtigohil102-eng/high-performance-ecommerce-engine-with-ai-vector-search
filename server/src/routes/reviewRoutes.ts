import { Router } from "express";
import {
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { authMiddleware } from "../middleware/authMiddleware";
import { updateReviewValidation, idParamValidation } from "../middleware/validate";

const router = Router();

// PUT /api/reviews/:id — edit own review (or admin)
router.put("/:id", authMiddleware, updateReviewValidation, updateReview);

// DELETE /api/reviews/:id — delete own review (or admin)
router.delete("/:id", authMiddleware, idParamValidation, deleteReview);

export default router;
