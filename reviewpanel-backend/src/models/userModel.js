import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import config from "../config/index.js";

const normalizeRole = (role) => (role ? role.toLowerCase() : 'admin');

const buildUserRecord = (rawUser, index) => {
  if (!rawUser?.username) {
    throw new Error('Each admin user must include a username');
  }

  let passwordHash;
  if (rawUser.passwordHash) {
    passwordHash = rawUser.passwordHash;
  } else if (rawUser.password) {
    // Check if password is already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(rawUser.password);
    passwordHash = isBcryptHash ? rawUser.password : bcrypt.hashSync(rawUser.password, 12);
  } else {
    passwordHash = null;
  }

  if (!passwordHash) {
    throw new Error(`Admin user ${rawUser.username} must include either password or passwordHash`);
  }

  return {
    id: rawUser.id ?? index + 1,
    username: rawUser.username,
    passwordHash,
    role: normalizeRole(rawUser.role)
  };
};

const loadUsersFromEnv = () => {
  if (process.env.ADMIN_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.ADMIN_USERS_JSON);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('ADMIN_USERS_JSON must be a non-empty array');
      }
      return parsed.map((user, index) => buildUserRecord(user, index));
    } catch (error) {
      throw new Error(`Unable to parse ADMIN_USERS_JSON: ${error.message}`);
    }
  }

  const username = process.env.ADMIN_DEFAULT_USERNAME;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (username && password) {
    return [buildUserRecord({ id: 1, username, password, role: process.env.ADMIN_DEFAULT_ROLE || 'admin' }, 0)];
  }

  throw new Error('No administrator credentials configured. Set ADMIN_USERS_JSON or ADMIN_DEFAULT_USERNAME and ADMIN_DEFAULT_PASSWORD.');
};

const users = loadUsersFromEnv();

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
      { id: user.id, username: user.username, role: role, jti: randomUUID() },
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