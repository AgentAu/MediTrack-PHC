/**
 * Small routes: who am I, and dashboard stats.
 */

import { Router } from "express";
import { asyncHandler } from "../utils/httpError.js";
import { getDashboardStats } from "../services/statsService.js";

const router = Router();

// GET /api/me - the signed-in user as the server sees them
router.get("/me", (req, res) => {
  res.json({ user: req.user });
});

// GET /api/stats - dashboard summary (all roles)
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    res.json(await getDashboardStats());
  })
);

export default router;
