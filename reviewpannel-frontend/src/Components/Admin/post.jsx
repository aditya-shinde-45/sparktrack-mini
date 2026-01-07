import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api"; // centralized API

const AdminPost = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    image: null,
    imagePreview: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Fetch all posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Get the correct admin token
  const getAdminToken = () => {
    // Try different possible token keys for admin
    return localStorage.getItem("admin_token") || 
           localStorage.getItem("token") || 
           localStorage.getItem("adminToken") ||
           localStorage.getItem("authToken");
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const data = await apiRequest("/api/posts", "GET", null, token);
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        setMessage("Failed to load posts");
      }
    } catch (error) {
      setMessage("Error fetching posts");
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setMessage(""); // Clear any previous error messages
    
    if (file) {
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        setMessage("Image size should be less than 10MB");
        e.target.value = ""; // Clear the input
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage("Only image files (JPEG, PNG, GIF, WebP) are allowed");
        e.target.value = ""; // Clear the input
        return;
      }
      
      setNewPost({
        ...newPost,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  // Remove selected image
  const removeImage = () => {
    if (newPost.imagePreview) {
      URL.revokeObjectURL(newPost.imagePreview);
    }
    setNewPost({
      ...newPost,
      image: null,
      imagePreview: null
    });
    setMessage(""); // Clear any error messages
    
    // Clear the file input
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Custom API request for multipart/form-data
  const apiRequestMultipart = async (endpoint, method = "GET", formData = null, token = null) => {
    const API_BASE_URL = import.meta.env.MODE === "development"
      ? import.meta.env.VITE_API_BASE_URL
      : import.meta.env.VITE_API_BASE_URL_PROD;

    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser handle it

    const options = { method, headers };
    if (formData) {
      options.body = formData;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.success === false) {
        // Handle specific error cases
        if (res.status === 401 || res.status === 403) {
          // Token invalid or expired
          localStorage.removeItem("admin_token");
          localStorage.removeItem("token");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("authToken");
          return {
            success: false,
            message: "Authentication failed. Please login again.",
            needsLogin: true
          };
        }
        return {
          success: false,
          message: data?.message || "API request failed",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Network error",
      };
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!newPost.title.trim() || !newPost.description.trim()) {
      setMessage("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const token = getAdminToken();
      
      if (!token) {
        setMessage("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", newPost.title.trim());
      formData.append("description", newPost.description.trim());
      if (newPost.image) {
        formData.append("image", newPost.image);
      }

      const data = await apiRequestMultipart("/api/posts", "POST", formData, token);
      
      if (data.needsLogin) {
        setMessage("Session expired. Please login again.");
        // Optionally redirect to login page
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
        return;
      }
      
      if (data.success) {
        setMessage("Post created successfully!");
        setNewPost({
          title: "",
          description: "",
          image: null,
          imagePreview: null
        });
        setIsCreateMode(false);
        fetchPosts(); // Refresh posts
        
        // Clear the file input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        setMessage(data.message || "Failed to create post");
      }
    } catch (error) {
      setMessage("Error creating post");
    } finally {
      setLoading(false);
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const token = getAdminToken();
      
      if (!token) {
        setMessage("Authentication token not found. Please login again.");
        return;
      }

      const data = await apiRequest(`/api/posts/${postId}`, "DELETE", null, token);
      
      if (data.needsLogin) {
        setMessage("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
        return;
      }
      
      if (data.success) {
        setMessage("Post deleted successfully");
        fetchPosts();
      } else {
        setMessage(data.message || "Failed to delete post");
      }
    } catch (error) {
      setMessage("Error deleting post");
    }
  };

  // Function to get image URL - handles different possible field names
  const getImageUrl = (post) => {
    // Check different possible field names for image
    const imageUrl = post.image || post.image_url || post.imageUrl || null;
    
    // Ensure the URL is properly formatted
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      return imageUrl.trim();
    }
    
    return null;
  };

  return (
    <div className="w-full">
      {/* Create Post Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 w-full space-y-6 border border-purple-100 mb-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-purple-700 mb-2">
              Create New Event Post
            </h2>
            <p className="text-gray-600 text-base">
              Share college event posts with students
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateMode(!isCreateMode)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
              isCreateMode 
                ? "bg-gray-100 text-purple-700 hover:bg-purple-50 border border-purple-200" 
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">
              {isCreateMode ? "Cancel" : "Create Post"}
            </span>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg text-center border ${
            message.includes("success") || message.includes("successfully")
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-center justify-center gap-2">
              {message.includes("success") || message.includes("successfully") ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium text-sm">{message}</span>
            </div>
          </div>
        )}

        {isCreateMode && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2 text-base">
                Event Title
              </label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                required
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 text-base"
                placeholder="Enter event title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2 text-base">
                Event Description
              </label>
              <textarea
                value={newPost.description}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                required
                rows="4"
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-gray-800 text-base resize-none"
                placeholder="Describe the event details..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2 text-base">
                Event Image
              </label>
              
              {!newPost.imagePreview ? (
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                      <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div>
                        <p className="text-lg font-semibold text-purple-700 mb-2">Upload Event Image</p>
                        <p className="text-sm text-gray-600 mb-1">Click to browse or drag and drop</p>
                        <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP up to 10MB</p>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={newPost.imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-purple-200 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-purple-700 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:bg-purple-400 disabled:cursor-not-allowed disabled:transform-none text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </div>
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        )}
      </form>

      {/* Posts Section */}
      <div className="w-full px-0 md:px-8 mb-10">
        <hr className="my-8 border-purple-200" />
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          All Event Posts
        </h2>
        
        {loading && posts.length === 0 ? (
          <div className="text-center text-purple-600 font-semibold text-lg py-8">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading posts...
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-purple-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-600 text-base">Create your first event post to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imageUrl = getImageUrl(post);
              
              return (
                <div key={post._id || post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-purple-100">
                  {/* Post Image */}
                  {imageUrl ? (
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          // Replace with placeholder on error
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Hidden placeholder that shows on error */}
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100"
                        style={{ display: 'none' }}
                      >
                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Image failed to load</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <div className="flex flex-col items-center text-gray-400">
                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">No Image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Post Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-red-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{post.views || 0}</span>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => deletePost(post._id || post.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full transition hover:bg-red-50"
                        title="Delete post"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Post Date */}
                    <div className="text-xs text-gray-500 font-medium">
                      {new Date(post.createdAt || post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPost;