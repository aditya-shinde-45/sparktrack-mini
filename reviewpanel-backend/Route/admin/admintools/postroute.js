import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  getPostsPaginated,
  uploadImage
} from '../../../controller/admin/postcontroller.js';
import { verifyToken } from '../../../middleware/authmiddleware.js';

const router = express.Router();

// @route   POST /api/admin/posts
// @desc    Create a new post with optional image
// @access  Admin only
router.post('/', verifyToken, uploadImage, createPost);

// @route   GET /api/admin/posts
// @desc    Get all posts (latest first)
// @access  Public
router.get('/', getAllPosts);

// @route   GET /api/admin/posts/paginated
// @desc    Get posts with pagination
// @access  Public
// @query   page=1&limit=10
router.get('/paginated', getPostsPaginated);

// @route   GET /api/admin/posts/:id
// @desc    Get single post by ID (increments view count)
// @access  Public
router.get('/:id', getPostById);

// @route   PUT /api/admin/posts/:id
// @desc    Update post by ID
// @access  Admin only
router.put('/:id', verifyToken, uploadImage, updatePost);

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post by ID
// @access  Admin only
router.delete('/:id', verifyToken, deletePost);

// @route   POST /api/admin/posts/:id/like
// @desc    Like or unlike a post
// @access  Authenticated users (Students/Admin)
// @body    { "action": "like" | "unlike" }
router.post('/:id/like', verifyToken, toggleLike);

export default router;