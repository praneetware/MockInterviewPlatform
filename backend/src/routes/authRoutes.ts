import express from "express";
import { authMiddleware }
from "../middleware/authMiddleware";

import {
 register,
 login,
 getMe
}
from "../controllers/authController";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get(
  "/me",
  authMiddleware,
  getMe
);

export default router;