import bcrypt from "bcryptjs";

// Mock admin user (replace with DB later)
export const users = [
  {
    id: 1,
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", 10), // hashed password
    role: "Admin",
  },
];
