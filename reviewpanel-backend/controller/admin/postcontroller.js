import supabase from '../../Model/supabase.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
    }
  }
});

// Upload middleware with error handling
export const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size should be less than 10MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let imageUrl = null;

    // Upload image to Supabase storage if provided
    if (image) {
      try {
        const fileExt = path.extname(image.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = `posts/${fileName}`;

        // Upload to Supabase storage bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('college-events') // Your bucket name
          .upload(filePath, image.buffer, {
            contentType: image.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image'
          });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('college-events')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      } catch (uploadErr) {
        console.error('Image upload error:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to process image upload'
        });
      }
    }

    // Insert post into database
    const { data: postData, error: dbError } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl,
        likes: 0,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // If database insert fails and image was uploaded, try to delete the image
      if (imageUrl) {
        const filePath = imageUrl.split('/').pop();
        await supabase.storage
          .from('college-events')
          .remove([`posts/${filePath}`]);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: postData.id,
        title: postData.title,
        description: postData.description,
        image: postData.image_url,
        likes: postData.likes,
        views: postData.views,
        createdAt: postData.created_at
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all posts
export const getAllPosts = async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }

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

    res.status(200).json({
      success: true,
      posts: formattedPosts
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single post by ID (increments view count)
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the current post data
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    const newViewCount = (currentPost.views || 0) + 1;
    
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ 
        views: newViewCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      // Return current post data even if view update fails
      return res.status(200).json({
        success: true,
        post: {
          _id: currentPost.id,
          title: currentPost.title,
          description: currentPost.description,
          image: currentPost.image_url,
          likes: currentPost.likes || 0,
          views: currentPost.views || 0,
          createdAt: currentPost.created_at
        }
      });
    }

    res.status(200).json({
      success: true,
      post: {
        _id: updatedPost.id,
        title: updatedPost.title,
        description: updatedPost.description,
        image: updatedPost.image_url,
        likes: updatedPost.likes || 0,
        views: updatedPost.views || 0,
        createdAt: updatedPost.created_at
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const image = req.file;

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    let imageUrl = existingPost.image_url;

    // Handle new image upload
    if (image) {
      try {
        // Delete old image if exists
        if (existingPost.image_url) {
          const oldImagePath = existingPost.image_url.split('/').slice(-2).join('/');
          await supabase.storage
            .from('college-events')
            .remove([oldImagePath]);
        }

        // Upload new image
        const fileExt = path.extname(image.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('college-events')
          .upload(filePath, image.buffer, {
            contentType: image.mimetype,
            upsert: false
          });

        if (uploadError) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new image'
          });
        }

        // Get new public URL
        const { data: urlData } = supabase.storage
          .from('college-events')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process image upload'
        });
      }
    }

    // Update post in database
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (image) updateData.image_url = imageUrl;

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: {
        _id: updatedPost.id,
        title: updatedPost.title,
        description: updatedPost.description,
        image: updatedPost.image_url,
        likes: updatedPost.likes,
        views: updatedPost.views,
        createdAt: updatedPost.created_at
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Get post to find image URL
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete image from storage if exists
    if (post.image_url) {
      try {
        const imagePath = post.image_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('college-events')
          .remove([imagePath]);
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete post from database
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Like/Unlike post - FIXED VERSION
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    if (!['like', 'unlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "like" or "unlike"'
      });
    }

    // First get the current post data
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', id)
      .single();

    if (fetchError || !currentPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Calculate new like count
    const currentLikes = currentPost.likes || 0;
    const increment = action === 'like' ? 1 : -1;
    const newLikeCount = Math.max(currentLikes + increment, 0); // Prevent negative likes

    // Update the post with new like count
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ 
        likes: newLikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('likes')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update like count'
      });
    }

    res.status(200).json({
      success: true,
      message: `Post ${action}d successfully`,
      likes: updatedPost.likes
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get posts with pagination
export const getPostsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get post count'
      });
    }

    // Get posts with pagination
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch posts'
      });
    }

    const formattedPosts = posts.map(post => ({
      _id: post.id,
      title: post.title,
      description: post.description,
      image: post.image_url,
      likes: post.likes || 0,
      views: post.views || 0,
      createdAt: post.created_at
    }));

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get paginated posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};