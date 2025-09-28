import express from 'express';
import postController, { uploadImage } from '../../controllers/admin/postController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/admin/tools/posts
 * @desc    Create a new post with optional image
 * @access  Private (Admin)
 */
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  uploadImage, 
  postController.createPost
);

/**
 * @route   GET /api/admin/tools/posts
 * @desc    Get all posts
 * @access  Public
 */
router.get('/', postController.getAllPosts);

/**
 * @route   GET /api/admin/tools/posts/paginated
 * @desc    Get posts with pagination
 * @access  Public
 */
router.get('/paginated', postController.getPostsPaginated);

/**
 * @route   GET /api/admin/tools/posts/:id
 * @desc    Get a post by ID
 * @access  Public
 */
router.get('/:id', postController.getPostById);

/**
 * @route   PUT /api/admin/tools/posts/:id
 * @desc    Update a post
 * @access  Private (Admin)
 */
router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  uploadImage, 
  postController.updatePost
);

/**
 * @route   DELETE /api/admin/tools/posts/:id
 * @desc    Delete a post
 * @access  Private (Admin)
 */
router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.authenticateAdmin, 
  postController.deletePost
);

/**
 * @route   POST /api/admin/tools/posts/:id/like
 * @desc    Toggle like/unlike for a post
 * @access  Private
 */
router.post(
  '/:id/like', 
  authMiddleware.verifyToken, 
  postController.toggleLike
);

export default router;