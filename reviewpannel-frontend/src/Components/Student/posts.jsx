import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";

const StudentPosts = ({ 
  isModalOpen = false, 
  onCloseModal = () => {}, 
  triggerFetch = false 
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [likingPosts, setLikingPosts] = useState(new Set());
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [viewedPosts, setViewedPosts] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch all posts on component mount or when triggered
  useEffect(() => {
    if (triggerFetch || isModalOpen) {
      fetchPosts();
    }
  }, [triggerFetch, isModalOpen]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle view when modal opens or index changes (only once per post)
  useEffect(() => {
    if (isModalOpen && posts.length > 0) {
      const currentPost = posts[currentPostIndex];
      if (currentPost && !viewedPosts.has(currentPost._id)) {
        handleViewPost(currentPost._id);
        setViewedPosts(prev => new Set(prev).add(currentPost._id));
      }
    }
  }, [isModalOpen, currentPostIndex, posts]);

  // Reset when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setCurrentPostIndex(0);
      setViewedPosts(new Set());
    }
  }, [isModalOpen]);

  // Fetch posts from API
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/posts", "GET");
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

  // Handle like/unlike post
  const handleLikePost = async (postId) => {
    if (likingPosts.has(postId)) {
      return;
    }

    try {
      const token = localStorage.getItem("student_token");
      
      if (!token) {
        setMessage("Please login to like posts");
        return;
      }

      setLikingPosts(prev => new Set(prev).add(postId));

      const isLiked = likedPosts.has(postId);
      const action = isLiked ? "unlike" : "like";

      // Optimistic update
      const newLikedPosts = new Set(likedPosts);
      if (isLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: isLiked ? Math.max((post.likes || 1) - 1, 0) : (post.likes || 0) + 1 
              }
            : post
        )
      );

      const data = await apiRequest(
        `/api/admin/posts/${postId}/like`, 
        "POST", 
        { action }, 
        token
      );
      
      if (!data.success) {
        // Revert on error
        setLikedPosts(likedPosts);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  likes: isLiked ? (post.likes || 0) + 1 : Math.max((post.likes || 1) - 1, 0)
                }
              : post
          )
        );
        setMessage(data.message || "Failed to update like status");
      }
    } catch (error) {
      // Revert on error
      setLikedPosts(likedPosts);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: likedPosts.has(postId) ? (post.likes || 0) + 1 : Math.max((post.likes || 1) - 1, 0)
              }
            : post
        )
      );
      setMessage("Like feature temporarily unavailable");
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Handle view post (only increment once per session per post)
  const handleViewPost = async (postId) => {
    try {
      const token = localStorage.getItem("student_token");
      
      if (!token) return;

      const data = await apiRequest(`/api/admin/posts/${postId}`, "GET", null, token);
      
      if (data.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, views: (post.views || 0) + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  // Navigation functions with animation
  const nextPost = () => {
    if (currentPostIndex < posts.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPostIndex(currentPostIndex + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const prevPost = () => {
    if (currentPostIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPostIndex(currentPostIndex - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isModalOpen && !isTransitioning) {
        if (e.key === 'ArrowLeft') {
          prevPost();
        } else if (e.key === 'ArrowRight') {
          nextPost();
        } else if (e.key === 'Escape') {
          onCloseModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, currentPostIndex, posts.length, isTransitioning]);

  // Function to get image URL
  const getImageUrl = (post) => {
    const imageUrl = post.image || post.image_url || post.imageUrl || null;
    
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      return imageUrl.trim();
    }
    
    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isModalOpen) return null;

  const currentPost = posts[currentPostIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 opacity-90"></div>
      
      {/* Message Display */}
      {message && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-60">
          <div className={`px-6 py-3 rounded-full backdrop-blur-md ${
            message.includes("success") || message.includes("successfully") || message.includes("copied")
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          } animate-slideInDown shadow-lg border border-white/20`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={message.includes("success") || message.includes("successfully") || message.includes("copied")
                    ? "M5 13l4 4L19 7"
                    : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  } 
                />
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      <button
        onClick={prevPost}
        disabled={currentPostIndex === 0 || isTransitioning}
        className="absolute left-4 md:left-8 z-10 p-4 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 shadow-lg border border-white/30"
        title="Previous post"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextPost}
        disabled={currentPostIndex === posts.length - 1 || isTransitioning}
        className="absolute right-4 md:right-8 z-10 p-4 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 shadow-lg border border-white/30"
        title="Next post"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Close Button */}
      <button
        onClick={onCloseModal}
        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-red-500/80 transition-all duration-200 transform hover:scale-110 shadow-lg border border-white/30 group"
      >
        <svg className="w-6 h-6 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Card Container */}
      <div className="relative w-full max-w-2xl mx-auto">
        {loading ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 text-center shadow-2xl border border-white/20">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 text-xl font-medium">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 text-center shadow-2xl border border-white/20">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Posts Available</h3>
            <p className="text-gray-500 text-lg">Check back later for new events and updates!</p>
          </div>
        ) : currentPost ? (
          <div className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            {/* Card Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1 truncate">{currentPost.title}</h2>
                <p className="text-purple-100">{currentPostIndex + 1} of {posts.length} posts</p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Post Image */}
              {getImageUrl(currentPost) && (
                <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
                  <img
                    src={getImageUrl(currentPost)}
                    alt={currentPost.title}
                    className="w-full h-auto max-h-[400px] object-contain rounded-2xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.nextElementSibling;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="w-full h-64 flex flex-col items-center justify-center text-gray-400"
                    style={{ display: 'none' }}
                  >
                    <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-lg">Image unavailable</span>
                  </div>
                </div>
              )}

              {/* Post Content */}
              <div className="text-center space-y-6">
                <div className="max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed text-justify whitespace-pre-wrap">
                    {currentPost.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50/80 backdrop-blur-sm p-6 border-t border-gray-200/50">
              <div className="flex items-center justify-between">
                {/* Like Button - Left */}
                <button
                  onClick={() => handleLikePost(currentPost._id)}
                  disabled={likingPosts.has(currentPost._id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 shadow-md ${
                    likedPosts.has(currentPost._id)
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                  }`}
                >
                  {likingPosts.has(currentPost._id) ? (
                    <div className="w-6 h-6 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-white/30"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    </div>
                  ) : (
                    <svg 
                      className={`w-6 h-6 transition-all duration-200 ${likedPosts.has(currentPost._id) ? 'fill-current' : 'fill-none'}`} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  <span className="font-semibold text-lg">{currentPost.likes || 0}</span>
                </button>
                
                {/* Date - Right */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600 font-medium">
                    {formatDate(currentPost.createdAt || currentPost.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideInDown {
          animation: slideInDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentPosts;