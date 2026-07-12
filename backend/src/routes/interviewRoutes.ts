import express from "express";



import {
  authMiddleware
} from "../middleware/authMiddleware";

import {
  createInterview,
  sendMessage,
  sendMessageById,
  endInterview,
  getHistory
} from "../controllers/interviewController";



const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createInterview
);

router.post(
  "/start",
  authMiddleware,
  createInterview
);

router.post(
  "/message",
  authMiddleware,
  sendMessage,
  sendMessageById
);



router.post(
 "/:id/end",
 authMiddleware,
 endInterview
);

export default router;

router.get(
 "/history",
 authMiddleware,
 getHistory
);

