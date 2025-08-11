import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { users } from "../Model/userModel.js";

export const login = (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Check role from DB, not frontend input
  if (user.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can log in" });
  }

  // Verify password
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Create JWT
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
};

export const adminDashboard = (req, res) => {
  res.json({ message: `Welcome Admin, ${req.user.username}!` });
};
