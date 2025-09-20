import supabase from "../../Model/supabase.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs only
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF, WEBP) and PDF files are allowed.'));
    }
  }
});

// Middleware for file upload
export const uploadFile = upload.single('file');

// ============= ANNOUNCEMENT FUNCTIONS =============

// Send announcement to all students with optional file upload
export async function sendAnnouncement(req, res) {
  const { title, message } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required." });
  }

  let fileUrl = null;
  let fileName = null;
  let fileType = null;
  let uniqueFileName = null;

  try {
    // Handle file upload if file is provided
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      uniqueFileName = `${uuidv4()}.${fileExtension}`;
      fileName = req.file.originalname;
      fileType = req.file.mimetype;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(`files/${uniqueFileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({ 
          message: "Failed to upload file.", 
          error: uploadError.message 
        });
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('announcements')
        .getPublicUrl(`files/${uniqueFileName}`);

      fileUrl = urlData.publicUrl;
    }

    // Insert announcement into the announcements table
    const { data, error } = await supabase
      .from("announcements")
      .insert([{ 
        title, 
        message, 
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        created_at: new Date().toISOString() 
      }])
      .select();

    if (error) {
      console.error('Database insert error:', error);
      // If database insert fails but file was uploaded, clean up the file
      if (fileUrl && uniqueFileName) {
        await supabase.storage
          .from('announcements')
          .remove([`files/${uniqueFileName}`]);
      }
      return res.status(500).json({ 
        message: "Failed to send announcement.", 
        error: error.message 
      });
    }

    res.json({ 
      message: "Announcement sent successfully!", 
      announcement: data[0],
      file_uploaded: !!fileUrl
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}

// Get all announcements
export async function getAnnouncements(req, res) {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return res.status(500).json({ 
        message: "Failed to fetch announcements.", 
        error: error.message 
      });
    }

    res.json({ announcements: data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}

// Delete an announcement by id
export async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ message: "Announcement ID is required." });
  }

  try {
    // First, get the announcement to check if it has a file
    const { data: announcement, error: fetchError } = await supabase
      .from("announcements")
      .select("file_url")
      .eq("id", id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database fetch error:', fetchError);
      return res.status(500).json({ 
        message: "Failed to fetch announcement.", 
        error: fetchError.message 
      });
    }

    // Delete the file from storage if it exists
    if (announcement?.file_url) {
      const urlParts = announcement.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage
        .from('announcements')
        .remove([`files/${fileName}`]);
    }

    // Delete the announcement from database
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return res.status(500).json({ 
        message: "Failed to delete announcement.", 
        error: deleteError.message 
      });
    }

    res.json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}

// Download file from announcement
export async function downloadAnnouncementFile(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ message: "Announcement ID is required." });
  }

  try {
    // Get the announcement file details
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select("file_url, file_name, file_type")
      .eq("id", id)
      .single();

    if (error || !announcement?.file_url) {
      return res.status(404).json({ message: "File not found." });
    }

    // Extract filename from URL
    const urlParts = announcement.file_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('announcements')
      .download(`files/${fileName}`);

    if (downloadError) {
      console.error('File download error:', downloadError);
      return res.status(500).json({ 
        message: "Failed to download file.", 
        error: downloadError.message 
      });
    }

    // Convert blob to buffer
    const buffer = await fileData.arrayBuffer();

    // Set appropriate headers
    res.setHeader('Content-Type', announcement.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${announcement.file_name}"`);
    
    // Send file
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}

// ============= PBL MARKS FUNCTIONS =============

// Show PBL Review 1 marks for a single student
export async function showPBLReview1Marks(req, res) {
  const { enrollement_no } = req.query;
  if (!enrollement_no) {
    return res.status(400).json({ message: "enrollement_no is required." });
  }
  
  try {
    const { data, error } = await supabase
      .from("pbl")
      .select("enrollement_no, total, feedback")
      .eq("enrollement_no", enrollement_no)
      .single();

    if (error) {
      console.error('Database fetch error:', error);
      return res.status(500).json({ 
        message: "Failed to fetch PBL Review 1 marks.", 
        error: error.message 
      });
    }

    res.json({ review1Marks: data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}

// Show PBL Review 2 marks for a single student
export async function showPBLReview2Marks(req, res) {
  const { enrollement_no } = req.query;
  if (!enrollement_no) {
    return res.status(400).json({ message: "enrollement_no is required." });
  }
  
  try {
    const { data, error } = await supabase
      .from("pbl2")
      .select("enrollement_no, total, feedback")
      .eq("enrollement_no", enrollement_no)
      .single();

    if (error) {
      console.error('Database fetch error:', error);
      return res.status(500).json({ 
        message: "Failed to fetch PBL Review 2 marks.", 
        error: error.message 
      });
    }

    res.json({ review2Marks: data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      message: "Internal server error.", 
      error: error.message 
    });
  }
}