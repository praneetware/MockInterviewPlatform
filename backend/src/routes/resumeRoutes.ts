import express from "express";

import { uploadResume, getMyResume, analyzeResumeController }
from "../controllers/resumeController";

import { authMiddleware }
from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  uploadResume
);

router.get(
  "/my",
  authMiddleware,
  getMyResume
);

router.get(
  "/current",
  authMiddleware,
  getMyResume
);

router.post(
  "/analyze",
  authMiddleware,
  analyzeResumeController
);

export default router;