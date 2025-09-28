import supabase from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Post model for blog/announcement posts
 */
class PostModel {
  constructor() {
    this.table = 'posts';
    this.storageBucket = 'college-events';
    this.storageFolder = 'posts';
  }

  /**
   * Get all posts ordered by creation date
   */
  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get posts with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  async getPaginated(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get posts with pagination
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      posts: data || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get a post by ID
   * @param {number} id - Post ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new post
   * @param {object} post - Post data
   * @param {Buffer} imageBuffer - Optional image buffer
   * @param {object} imageInfo - Optional image metadata
   */
  async create(post, imageBuffer = null, imageInfo = null) {
    let imageUrl = null;

    // Upload image if provided
    if (imageBuffer && imageInfo) {
      const fileExt = path.extname(imageInfo.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `${this.storageFolder}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(this.storageBucket)
        .upload(filePath, imageBuffer, {
          contentType: imageInfo.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    // Insert post into database
    const { data, error } = await supabase
      .from(this.table)
      .insert({
        title: post.title.trim(),
        description: post.description.trim(),
        image_url: imageUrl,
        likes: 0,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Clean up the uploaded image if database insert fails
      if (imageUrl) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from(this.storageBucket)
          .remove([`${this.storageFolder}/${fileName}`]);
      }
      throw error;
    }

    return data;
  }

  /**
   * Update an existing post
   * @param {number} id - Post ID
   * @param {object} updates - Fields to update
   * @param {Buffer} imageBuffer - Optional new image buffer
   * @param {object} imageInfo - Optional new image metadata
   */
  async update(id, updates, imageBuffer = null, imageInfo = null) {
    // Get existing post
    const existingPost = await this.getById(id);
    if (!existingPost) throw new Error('Post not found');

    let imageUrl = existingPost.image_url;

    // Handle new image upload
    if (imageBuffer && imageInfo) {
      // Delete old image if exists
      if (existingPost.image_url) {
        const oldImagePath = existingPost.image_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from(this.storageBucket)
          .remove([oldImagePath]);
      }

      // Upload new image
      const fileExt = path.extname(imageInfo.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `${this.storageFolder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(this.storageBucket)
        .upload(filePath, imageBuffer, {
          contentType: imageInfo.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get new public URL
      const { data: urlData } = supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title.trim();
    if (updates.description) updateData.description = updates.description.trim();
    if (imageBuffer) updateData.image_url = imageUrl;

    // Update in database
    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   */
  async delete(id) {
    // Get post to find image URL
    const { data: post, error: fetchError } = await supabase
      .from(this.table)
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete image from storage if exists
    if (post?.image_url) {
      try {
        const imagePath = post.image_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from(this.storageBucket)
          .remove([imagePath]);
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete post from database
    const { error: deleteError } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    return true;
  }

  /**
   * Update view count for a post
   * @param {number} id - Post ID
   */
  async incrementViews(id) {
    // Get current post
    const existingPost = await this.getById(id);
    if (!existingPost) throw new Error('Post not found');

    // Increment view count
    const newViewCount = (existingPost.views || 0) + 1;
    
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        views: newViewCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Toggle like/unlike for a post
   * @param {number} id - Post ID
   * @param {string} action - 'like' or 'unlike'
   */
  async toggleLike(id, action) {
    if (!['like', 'unlike'].includes(action)) {
      throw new Error('Action must be either "like" or "unlike"');
    }

    // Get current post
    const existingPost = await this.getById(id);
    if (!existingPost) throw new Error('Post not found');

    // Calculate new like count
    const currentLikes = existingPost.likes || 0;
    const increment = action === 'like' ? 1 : -1;
    const newLikeCount = Math.max(currentLikes + increment, 0); // Prevent negative likes

    // Update the post
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        likes: newLikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('likes')
      .single();

    if (error) throw error;
    return data;
  }
}

export default new PostModel();