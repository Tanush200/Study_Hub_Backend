import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  res.json({ msg: "You are authorized!", userId: req.user });
});

export default router;
