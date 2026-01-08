import express from 'express';
import reviewerAdminController from '../../controllers/reviewerAdmin/reviewerAdminController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Login route (no auth required)
router.post('/login', reviewerAdminController.login);

// Protected routes (require reviewerAdmin role)
router.get('/groups', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.getAllGroups
);

router.get('/pbl2/evaluation/:groupId', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.getPbl2Evaluation
);

router.get('/pbl3/evaluation/:groupId', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.getPbl3Evaluation
);

router.post('/reset-pbl2/:groupId', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.resetPbl2Marks
);

router.post('/reset-pbl3/:groupId', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.resetPbl3Marks
);

router.put('/edit-pbl2', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.editPbl2Marks
);

router.put('/edit-pbl3', 
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['reviewerAdmin']),
  reviewerAdminController.editPbl3Marks
);

export default router;
