import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

// In a real production application, this should be stored in a database
const users = [
  {
    id: 1,
    username: "8698078603",
    passwordHash: bcrypt.hashSync("strawhats", 10),
    role: "Admin",
  },
];

/**
 * User model for authentication
 */
class UserModel {
  /**
   * Get all users
   */
  async getAll() {
    // Return a copy to avoid modification of the original data
    return [...users].map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  /**
   * Find user by username
   * @param {string} username - Username to find
   */
  async findByUsername(username) {
    return users.find(user => user.username === username);
  }
  
  /**
   * Find user by ID
   * @param {number|string} id - User ID to find
   */
  async findById(id) {
    // Convert to number if it's a string (JWT might store as string)
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    return users.find(user => user.id === userId);
  }

  /**
   * Validate user credentials
   * @param {string} username - Username
   * @param {string} password - Plain text password
   */
  async validateCredentials(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    // Return user data without password
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Generate JWT token for user
   * @param {object} user - User object
   */
  generateToken(user) {
    // Ensure role is included and stored in a consistent format
    const role = user.role ? user.role.toLowerCase() : 'admin';
    
    return jwt.sign(
      { id: user.id, username: user.username, role: role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Ensure decoded token has required fields
      if (!decoded || !decoded.id || !decoded.username || !decoded.role) {
        console.warn('Token verification failed: Missing required fields');
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
  }
  
  /**
   * Get user counts by role
   * @returns {Object} User counts by role
   */
  async getUserCountsByRole() {
    // Mock data for development
    return {
      admin: 1,
      mentor: 3,
      external: 5
    };
  }
  
  /**
   * Get recent activities
   * @returns {Array} Recent activities
   */
  async getRecentActivities() {
    // Mock data for development
    return [
      {
        id: 1,
        user: "Admin",
        action: "Updated system settings",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        user: "Mentor",
        action: "Evaluated group project",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];
  }
}

export default new UserModel();