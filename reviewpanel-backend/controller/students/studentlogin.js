import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../../Model/supabase.js";
import { sendMail } from "../../Model/email.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

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

  console.log("setNewUserPassword - authData:", authData);

  if (error || !authData) {
    console.log("setNewUserPassword - User not found or error:", error);
    return res.status(400).json({ message: "User not found. Please request OTP first." });
  }
  if (authData.password_hash) {
    console.log("setNewUserPassword - Password already set for:", email);
    return res.status(400).json({ message: "Password already set. Please login or use forgot password." });
  }

  // Check OTP and expiry using UTC
  const dbOtp = String(authData.otp);
  const reqOtp = String(otp);
  const nowUTC = dayjs().utc();
  const expiryUTC = dayjs(authData.otp_expiry).utc();

  console.log("setNewUserPassword - dbOtp:", dbOtp, "reqOtp:", reqOtp);
  console.log("setNewUserPassword - nowUTC:", nowUTC.format(), "expiryUTC:", expiryUTC.format());

  if (!dbOtp || dbOtp !== reqOtp) {
    console.log("setNewUserPassword - Invalid OTP");
    return res.status(400).json({ message: "Invalid OTP." });
  }
  if (nowUTC.isAfter(expiryUTC)) {
    console.log("setNewUserPassword - Expired OTP");
    return res.status(400).json({ message: "Expired OTP." });
  }

  // Set password and clear OTP only after successful verification
  const hash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabase
    .from("student_auth")
    .update({ password_hash: hash, otp: null, otp_expiry: null })
    .eq("email", email);

  if (updateError) {
    console.log("setNewUserPassword - Error updating password:", updateError);
    return res.status(500).json({ message: "Error saving password." });
  }

  console.log("setNewUserPassword - Password set successfully for:", email);
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

  console.log("sendForgotPasswordOtp - authData:", data);

  if (error || !data) {
    console.log("sendForgotPasswordOtp - User not found or error:", error);
    return res.status(400).json({ message: "User not found" });
  }

  const otp = generateOTP();
  const expiry = dayjs().utc().add(10, "minute").toISOString();
  const { error: updateError } = await supabase
    .from("student_auth")
    .update({ otp, otp_expiry: expiry })
    .eq("email", email);

  if (updateError) {
    console.log("sendForgotPasswordOtp - Error updating OTP:", updateError);
    return res.status(500).json({ message: "Error sending OTP." });
  }

  await sendOtpEmail(email, otp);
  console.log("sendForgotPasswordOtp - OTP sent to:", email, "OTP:", otp, "Expiry:", expiry);
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

  console.log("resetPasswordWithOtp - authData:", authData);

  if (error || !authData) {
    console.log("resetPasswordWithOtp - User not found or error:", error);
    return res.status(400).json({ message: "User not found. Please request OTP first." });
  }

  const dbOtp = String(authData.otp);
  const reqOtp = String(otp);
  const nowUTC = dayjs().utc();
  const expiryUTC = dayjs(authData.otp_expiry).utc();

  console.log("resetPasswordWithOtp - dbOtp:", dbOtp, "reqOtp:", reqOtp);
  console.log("resetPasswordWithOtp - nowUTC:", nowUTC.format(), "expiryUTC:", expiryUTC.format());

  if (!dbOtp || dbOtp !== reqOtp) {
    console.log("resetPasswordWithOtp - Invalid OTP");
    return res.status(400).json({ message: "Invalid OTP." });
  }
  if (nowUTC.isAfter(expiryUTC)) {
    console.log("resetPasswordWithOtp - Expired OTP");
    return res.status(400).json({ message: "Expired OTP." });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabase
    .from("student_auth")
    .update({ password_hash: hash, otp: null, otp_expiry: null })
    .eq("email", email);

  if (updateError) {
    console.log("resetPasswordWithOtp - Error updating password:", updateError);
    return res.status(500).json({ message: "Error saving password." });
  }

  console.log("resetPasswordWithOtp - Password reset successful for:", email);
  res.json({ message: "Password reset successful. You can now login." });
}

// Login (now supports login with enrollment_no instead of email)
export async function studentLogin(req, res) {
  const { enrollment_no, password } = req.body;

  // Find user by enrollment_no
  const { data, error } = await supabase
    .from("student_auth")
    .select("enrollment_no, email, password_hash")
    .eq("enrollment_no", enrollment_no)
    .single();

  if (error || !data) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign(
    { enrollment_no: data.enrollment_no, email: data.email },
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

// Change Password (for authenticated users in profile settings)
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

// Update Student Password (for header functionality - uses enrollment_no from token)
export async function updateStudentPassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  
  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Get student from token
    const enrollmentNo = req.user.enrollment_no;

    // Get current student password from student_auth
    const { data: student, error: fetchError } = await supabase
      .from("student_auth")
      .select("password_hash")
      .eq("enrollment_no", enrollmentNo)
      .single();

    if (fetchError || !student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, student.password_hash);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in student_auth
    const { error: updateError } = await supabase
      .from("student_auth")
      .update({ password_hash: hashedNewPassword })
      .eq("enrollment_no", enrollmentNo);

    if (updateError) {
      throw updateError;
    }

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
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

  // Generate OTP and expiry (store in UTC)
  const otp = generateOTP();
  // Always use UTC for expiry!
  const expiry = dayjs().utc().add(10, "minute").toISOString();

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

// Get Student Profile (fetches from students table using enrollment_no from token)
export async function getStudentProfile(req, res) {
  try {
    const { enrollment_no } = req.user;

    // Get basic student data from students table
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("enrollment_no", enrollment_no)
      .single();


    if (studentError || !student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ IMPORTANT: Also get extended profile data (includes profile picture)
    const { data: extendedProfile, error: profileError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("enrollment_no", enrollment_no)
      .single();

    // Merge basic info with extended profile (even if extended profile doesn't exist)
    const fullProfile = {
      ...student,
      ...extendedProfile // This adds profile_picture_url, bio, skills, etc.
    };


    res.json({ profile: fullProfile });
  } catch (err) {
    console.error("❌ Error fetching student profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}