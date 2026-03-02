import multer from 'multer';
import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import postModel from '../../models/postModel.js';
import { createUploader } from '../../utils/secureUpload.js';

// Secure upload: images only, 10 MB max, with extension whitelist
const _uploader = createUploader('image');

// Export multer middleware for route usage
export const uploadImage = (req, res, next) => {
  _uploader.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return ApiResponse.error(res, 'Image size should be less than 10MB', 400);
      }
      return ApiResponse.error(res, 'File upload error: ' + err.message, 400);
    } else if (err) {
      return ApiResponse.error(res, err.message, 400);
    }
    next();
  });
};

/**
 * Controller for post operations
 */
class PostController {
  /**
   * Create a new post with optional image
   */
  createPost = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      throw ApiError.badRequest('Title and description are required');
    }
    
    const post = await postModel.create(
      { title, description },
      req.file?.buffer,
      req.file
    );
    
    return ApiResponse.success(
      res,
      'Post created successfully',
      {
        post: {
          _id: post.id,
          title: post.title,
          description: post.description,
          image: post.image_url,
          likes: post.likes,
          views: post.views,
          createdAt: post.created_at
        }
      },
      201
    );
  });

  /**
   * Get all posts (latest first)
   */
  getAllPosts = asyncHandler(async (req, res) => {
    const posts = await postModel.getAll();
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      _id: post.id,
      title: post.title,
      description: post.description,
      image: post.image_url,
      likes: post.likes || 0,
      views: post.views || 0,
      createdAt: post.created_at
    }));
    
    return ApiResponse.success(
      res,
      'Posts retrieved successfully',
      { posts: formattedPosts }
    );
  });

  /**
   * Get posts with pagination
   */
  getPostsPaginated = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const { posts, pagination } = await postModel.getPaginated(page, limit);
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      _id: post.id,
      title: post.title,
      description: post.description,
      image: post.image_url,
      likes: post.likes || 0,
      views: post.views || 0,
      createdAt: post.created_at
    }));
    
    return ApiResponse.success(
      res,
      'Posts retrieved successfully',
      { posts: formattedPosts, pagination }
    );
  });

  /**
   * Get a post by ID (increments view count)
   */
  getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Increment view and get updated post
    const post = await postModel.incrementViews(id);
    
    return ApiResponse.success(
      res,
      'Post retrieved successfully',
      {
        post: {
          _id: post.id,
          title: post.title,
          description: post.description,
          image: post.image_url,
          likes: post.likes || 0,
          views: post.views || 0,
          createdAt: post.created_at
        }
      }
    );
  });

  /**
   * Update a post
   */
  updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const post = await postModel.update(
      id,
      { title, description },
      req.file?.buffer,
      req.file
    );
    
    return ApiResponse.success(
      res,
      'Post updated successfully',
      {
        post: {
          _id: post.id,
          title: post.title,
          description: post.description,
          image: post.image_url,
          likes: post.likes || 0,
          views: post.views || 0,
          createdAt: post.created_at
        }
      }
    );
  });

  /**
   * Delete a post
   */
  deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await postModel.delete(id);
    
    return ApiResponse.success(
      res,
      'Post deleted successfully'
    );
  });

  /**
   * Toggle like/unlike for a post
   */
  toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    
    if (!['like', 'unlike'].includes(action)) {
      throw ApiError.badRequest('Action must be either "like" or "unlike"');
    }
    
    const result = await postModel.toggleLike(id, action);
    
    return ApiResponse.success(
      res,
      `Post ${action}d successfully`,
      { likes: result.likes }
    );
  });
}

export default new PostController();