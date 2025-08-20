import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../../Model/supabase.js";
import { sendMail } from "../../Model/email.js"; // use centralized email module

// Helper: Generate OTP
function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

// Helper: Send OTP Email with custom message
async function sendOtpEmail(email, otp) {
  const subject = "Your SparkTrack OTP";
  const text = `Dear Student,

Your One-Time Password (OTP) for SparkTrack is: ${otp}

Please use this OTP to verify your account or reset your password. 
Do not share this code with anyone.

If you did not request this, please ignore this email.

Thank you,
SparkTrack Team`;

  await sendMail(email, subject, text);
}

// New User: Set Password (first time)
export async function setNewUserPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  // Fetch user from student_auth
  const { data: authData, error } = await supabase
    .from("student_auth")
    .select("otp, otp_expiry, password_hash")
    .eq("email", email)
    .single();

  if (error || !authData) {
    return res.status(400).json({ message: "User not found. Please request OTP first." });
  }
  if (authData.password_hash) {
    return res.status(400).json({ message: "Password already set. Please login or use forgot password." });
  }

  // Check OTP and expiry
  const dbOtp = String(authData.otp);
  const reqOtp = String(otp);
  const expiry = new Date(authData.otp_expiry);
  const now = new Date();

  if (!dbOtp || dbOtp !== reqOtp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }
  if (now > expiry) {
    return res.status(400).json({ message: "Expired OTP." });
  }

  // Set password and clear OTP only after successful verification
  const hash = await bcrypt.hash(newPassword, 10);
  await supabase
    .from("student_auth")
    .update({ password_hash: hash, otp: null, otp_expiry: null })
    .eq("email", email);

  res.json({ message: "Registration successful. You can now login." });
}

// Forgot Password: Send OTP
export async function sendForgotPasswordOtp(req, res) {
  const { email } = req.body;
  const { data, error } = await supabase
    .from("student_auth")
    .select("email")
    .eq("email", email)
    .single();

  if (error || !data) return res.status(400).json({ message: "User not found" });

  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60000).toISOString();
  await supabase
    .from("student_auth")
    .update({ otp, otp_expiry: expiry })
    .eq("email", email);

  await sendOtpEmail(email, otp); // uses custom message
  res.json({ message: "OTP sent to your email" });
}

// Forgot Password: Verify OTP and Reset Password
export async function resetPasswordWithOtp(req, res) {
  const { email, otp, newPassword } = req.body;

  const { data: authData, error } = await supabase
    .from("student_auth")
    .select("otp, otp_expiry")
    .eq("email", email)
    .single();

  if (error || !authData) {
    return res.status(400).json({ message: "User not found. Please request OTP first." });
  }

  const dbOtp = String(authData.otp);
  const reqOtp = String(otp);
  const expiry = new Date(authData.otp_expiry);
  const now = new Date();

  if (!dbOtp || dbOtp !== reqOtp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }
  if (now > expiry) {
    return res.status(400).json({ message: "Expired OTP." });
  }

  // Set password and clear OTP only after successful verification
  const hash = await bcrypt.hash(newPassword, 10);
  await supabase
    .from("student_auth")
    .update({ password_hash: hash, otp: null, otp_expiry: null })
    .eq("email", email);

  res.json({ message: "Password reset successful. You can now login." });
}

// Login
export async function studentLogin(req, res) {
  const { email, password } = req.body;
  const { data, error } = await supabase
    .from("student_auth")
    .select("enrollment_no, password_hash")
    .eq("email", email)
    .single();

  if (error || !data) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign(
    { enrollment_no: data.enrollment_no, email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.json({ token, message: "Login successful" });
}

// Middleware: Authenticate User
export async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Get User Profile
export async function getUserProfile(req, res) {
  const { email } = req.user;
  const { data, error } = await supabase
    .from("student_auth")
    .select("enrollment_no, email")
    .eq("email", email)
    .single();

  if (error || !data) return res.status(400).json({ message: "User not found" });

  res.json({ profile: data });
}

// Update User Profile
export async function updateUserProfile(req, res) {
  const { email } = req.user;
  const { enrollment_no, newEmail } = req.body;

  const { data, error } = await supabase
    .from("student_auth")
    .update({ enrollment_no, email: newEmail })
    .eq("email", email);

  if (error) return res.status(400).json({ message: "Error updating profile" });

  res.json({ message: "Profile updated successfully" });
}

// Change Password
export async function changePassword(req, res) {
  const { email } = req.user;
  const { oldPassword, newPassword } = req.body;

  const { data, error } = await supabase
    .from("student_auth")
    .select("password_hash")
    .eq("email", email)
    .single();

  if (error || !data) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(oldPassword, data.password_hash);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const hash = await bcrypt.hash(newPassword, 10);
  await supabase
    .from("student_auth")
    .update({ password_hash: hash })
    .eq("email", email);

  res.json({ message: "Password changed successfully" });
}

// First Time User: Send OTP
export async function sendFirstTimeOtp(req, res) {
  const { email } = req.body;

  // Check if already registered
  const { data: authData } = await supabase
    .from("student_auth")
    .select("email")
    .eq("email", email)
    .single();
  if (authData) {
    return res.status(400).json({ message: "User already registered. Please login or use forgot password." });
  }

  // Check if email exists in students table
  const { data: studentData } = await supabase
    .from("students")
    .select("enrollment_no, email_id")
    .eq("email_id", email)
    .single();
  if (!studentData) {
    return res.status(400).json({ message: "Email not found in student records." });
  }

  // Generate OTP and expiry
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60000).toISOString();

  // Insert into student_auth with OTP (if not exists)
  await supabase
    .from("student_auth")
    .insert([
      {
        enrollment_no: studentData.enrollment_no,
        email: studentData.email_id,
        otp,
        otp_expiry: expiry,
      },
    ]);

  await sendOtpEmail(email, otp); // uses custom message
  res.json({ message: "OTP sent to your email." });
}