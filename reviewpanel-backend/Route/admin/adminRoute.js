import express from "express";
import {
  getAllExternals,
  addExternal,
  updateExternal,
  deleteExternal,
  getPBLData,
  addPBLGroup,
  updatePBLGroup,
  getPBLGroupById,
  getAllMentors,
} from "../../controller/admin/adminController.js";
import { verifyToken } from "../../middleware/authmiddleware.js";

const router = express.Router();

// ===== Externals Routes =====
router.get("/externals", verifyToken, getAllExternals); // Get all externals
router.post("/externals", verifyToken, addExternal); // Add new external
router.put("/externals/:external_id", verifyToken, updateExternal); // Update external
router.delete("/externals/:external_id", verifyToken, deleteExternal); // Delete external

// ===== PBL Routes =====
router.get("/pbl", verifyToken, getPBLData); // Get all PBL data
router.post("/pbl", verifyToken, addPBLGroup); // Add new PBL group
router.put("/pbl/:group_id", verifyToken, updatePBLGroup); // Update PBL group
// in adminRoutes.js
router.get('/pbl/:group_id', verifyToken, getPBLGroupById);
router.get("/mentors", verifyToken, getAllMentors); // Get PBL group by ID


export default router;
