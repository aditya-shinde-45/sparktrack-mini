import supabase from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Announcement model
 */
class AnnouncementModel {
  constructor() {
    this.table = 'announcements';
    this.storageFolder = 'announcements';
  }

  /**
   * Get all announcements
   */
  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get an announcement by ID
   * @param {number} id - Announcement ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get file details for an announcement
   * @param {number} id - Announcement ID
   */
  async getFileDetails(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('file_url, file_name, file_type')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new announcement
   * @param {object} announcement - Announcement data
   * @param {Buffer} fileBuffer - Optional file buffer
   * @param {object} fileInfo - Optional file metadata
   */
  async create(announcement, fileBuffer = null, fileInfo = null) {
    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let uniqueFileName = null;

    // Handle file upload if file is provided
    if (fileBuffer && fileInfo) {
      const fileExtension = fileInfo.originalname.split('.').pop();
      uniqueFileName = `${uuidv4()}.${fileExtension}`;
      fileName = fileInfo.originalname;
      fileType = fileInfo.mimetype;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.storageFolder)
        .upload(`files/${uniqueFileName}`, fileBuffer, {
          contentType: fileInfo.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(this.storageFolder)
        .getPublicUrl(`files/${uniqueFileName}`);

      fileUrl = urlData.publicUrl;
    }

    // Insert announcement into the announcements table
    const { data, error } = await supabase
      .from(this.table)
      .insert([{
        title: announcement.title,
        message: announcement.message,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      // If database insert fails but file was uploaded, clean up the file
      if (fileUrl && uniqueFileName) {
        await supabase.storage
          .from(this.storageFolder)
          .remove([`files/${uniqueFileName}`]);
      }
      throw error;
    }

    return {
      announcement: data[0],
      fileUploaded: !!fileUrl
    };
  }

  /**
   * Delete an announcement and its associated file
   * @param {number} id - Announcement ID
   */
  async delete(id) {
    // First, get the announcement to check if it has a file
    const { data: announcement, error: fetchError } = await supabase
      .from(this.table)
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // Delete the file from storage if it exists
    if (announcement?.file_url) {
      const urlParts = announcement.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const { error: removeError } = await supabase.storage
        .from(this.storageFolder)
        .remove([`files/${fileName}`]);

      if (removeError) throw removeError;
    }

    // Delete the announcement from database
    const { error: deleteError } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    return true;
  }

  /**
   * Download a file from an announcement
   * @param {number} id - Announcement ID
   */
  async downloadFile(id) {
    // Get the announcement file details
    const { data: announcement, error } = await supabase
      .from(this.table)
      .select('file_url, file_name, file_type')
      .eq('id', id)
      .single();

    if (error || !announcement?.file_url) throw new Error('File not found');

    // Extract filename from URL
    const urlParts = announcement.file_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(this.storageFolder)
      .download(`files/${fileName}`);

    if (downloadError) throw downloadError;

    return {
      fileData,
      fileName: announcement.file_name,
      fileType: announcement.file_type
    };
  }
}

export default new AnnouncementModel();