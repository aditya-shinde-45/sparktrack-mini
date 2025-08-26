import supabase from "../../Model/supabase.js";
import multer from "multer";
import path from "path";

// Use memory storage for Supabase upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type for resume. Only PDF and Word documents are allowed.'));
      }
    } else if (file.fieldname === 'profilePicture') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type for profile picture. Only JPG, PNG, and WebP images are allowed.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Upload file to Supabase Storage
const uploadToSupabase = async (file, folder, enrollmentNo) => {
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${enrollmentNo}-${Date.now()}${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('student-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true // Replace if file exists
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('student-files')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Delete old file from Supabase Storage
const deleteFromSupabase = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'student-files');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('student-files')
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting old file:', error);
    }
  } catch (error) {
    console.error('Error in deleteFromSupabase:', error);
  }
};

// Get student extended profile
export const getStudentProfile = async (req, res) => {
  const { enrollment_no } = req.params;
  
  try {
    // Get basic student info
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("enrollment_no", enrollment_no)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get extended profile info
    const { data: extendedProfile, error: profileError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("enrollment_no", enrollment_no)
      .single();

    // Merge basic info with extended profile (even if profile doesn't exist yet)
    const profile = {
      ...student,
      ...extendedProfile,
    };

    res.json({ profile });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  const { enrollment_no } = req.params;
  
  try {
    const {
      bio,
      skills,
      github_url,
      linkedin_url,
      portfolio_url
    } = req.body;

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("enrollment_no")
      .eq("enrollment_no", enrollment_no)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get existing profile to check for old files
    const { data: existingProfile } = await supabase
      .from("student_profiles")
      .select("resume_url, profile_picture_url")
      .eq("enrollment_no", enrollment_no)
      .single();

    let resume_url = existingProfile?.resume_url || null;
    let profile_picture_url = existingProfile?.profile_picture_url || null;
    
    // Handle file uploads to Supabase
    if (req.files) {
      if (req.files.resume && req.files.resume[0]) {
        // Delete old resume if exists
        if (existingProfile?.resume_url) {
          await deleteFromSupabase(existingProfile.resume_url);
        }
        resume_url = await uploadToSupabase(req.files.resume[0], 'resumes', enrollment_no);
      }
      
      if (req.files.profilePicture && req.files.profilePicture[0]) {
        // Delete old profile picture if exists
        if (existingProfile?.profile_picture_url) {
          await deleteFromSupabase(existingProfile.profile_picture_url);
        }
        profile_picture_url = await uploadToSupabase(req.files.profilePicture[0], 'profile-pictures', enrollment_no);
      }
    }

    const profileData = {
      enrollment_no,
      bio: bio || null,
      skills: skills || null,
      github_url: github_url || null,
      linkedin_url: linkedin_url || null,
      portfolio_url: portfolio_url || null,
      resume_url,
      profile_picture_url,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("student_profiles")
        .update(profileData)
        .eq("enrollment_no", enrollment_no)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("student_profiles")
        .insert(profileData)
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error("Database error:", result.error);
      throw result.error;
    }

    // Get updated full profile with student info
    const { data: updatedStudent, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("enrollment_no", enrollment_no)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const fullProfile = {
      ...updatedStudent,
      ...result.data,
    };

    res.json({ 
      message: "Profile updated successfully",
      profile: fullProfile 
    });
  } catch (err) {
    console.error("Error updating student profile:", err);
    res.status(500).json({ 
      message: "Internal server error",
      error: err.message 
    });
  }
};

// Export multer configuration for routes
export const uploadFiles = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]);