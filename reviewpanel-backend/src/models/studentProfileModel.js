import path from 'path';
import supabase from '../config/database.js';

const PROFILE_BUCKET = 'student-files';

/**
 * Model dedicated to the extended student profile (resume, social links, etc.)
 */
class StudentProfileModel {
  constructor() {
    this.profileTable = 'student_profiles';
    this.studentsTable = 'students';
  }

  /**
   * Fetch only the extended profile for a student
   */
  async getProfile(enrollmentNo) {
    const { data, error } = await supabase
      .from(this.profileTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  }

  /**
   * Merge core student info with extended profile info
   */
  async getFullProfile(enrollmentNo) {
    const { data: student, error: studentError } = await supabase
      .from(this.studentsTable)
      .select('*')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (studentError) throw studentError;

    const profile = await this.getProfile(enrollmentNo);

    return {
      ...student,
      ...profile,
    };
  }

  /**
   * Update or create extended profile entry
   */
  async upsertProfile(enrollmentNo, updates) {
    const profile = await this.getProfile(enrollmentNo);

    const payload = {
      enrollment_no: enrollmentNo,
      bio: updates.bio ?? null,
      skills: updates.skills ?? null,
      github_url: updates.github_url ?? null,
      linkedin_url: updates.linkedin_url ?? null,
      portfolio_url: updates.portfolio_url ?? null,
      resume_url: updates.resume_url ?? null,
      profile_picture_url: updates.profile_picture_url ?? null,
      phone: updates.phone ?? null,
    };

    if (profile) {
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(this.profileTable)
        .update(payload)
        .eq('enrollment_no', enrollmentNo)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    payload.created_at = new Date().toISOString();
    payload.updated_at = payload.created_at;

    const { data, error } = await supabase
      .from(this.profileTable)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload a file to Supabase storage and return the public URL
   */
  async uploadFile(file, folder, enrollmentNo) {
    const extension = path.extname(file.originalname) || '';
    const fileName = `${enrollmentNo}-${Date.now()}${extension}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * Remove a file from Supabase storage if a URL already exists
   */
  async deleteFile(publicUrl) {
    if (!publicUrl) return;

    const url = new URL(publicUrl);
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.findIndex(segment => segment === PROFILE_BUCKET);

    if (bucketIndex === -1) return;

    const filePath = pathSegments.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .remove([filePath]);

    if (error) throw error;
  }
}

export default new StudentProfileModel();
