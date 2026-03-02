import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  roleLogin
} from "../../controllers/admin/rolesController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { loginLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Public route - Role login
router.post("/login", loginLimiter, roleLogin);

// Protected routes - Require admin authentication
router.post("/", authMiddleware.authenticateUser, createRole);
router.get("/", authMiddleware.authenticateUser, getAllRoles);
router.get("/:id", authMiddleware.authenticateUser, getRoleById);
router.put("/:id", authMiddleware.authenticateUser, updateRole);
router.delete("/:id", authMiddleware.authenticateUser, deleteRole);

export default router;
