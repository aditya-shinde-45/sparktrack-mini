import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import industrialMentorModel from '../../models/industrialMentorModel.js';
import config from '../../config/index.js';
import supabase from '../../config/database.js';

class IndustrialMentorAuthController {
  industrialMentorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const records = await industrialMentorModel.validateCredentials(username, password);
    if (!records || records.length === 0) {
      throw ApiError.unauthorized('Invalid industrial mentor credentials');
    }

    // Primary record (first entry) used for identity fields
    const primary = records[0];
    // Collect all unique mentor_codes this industry mentor is linked to
    const mentorCodes = [...new Set(records.map((r) => r.mentor_code).filter(Boolean))];

    const token = jwt.sign(
      {
        industrial_mentor_code: primary.industrial_mentor_code,
        mentor_code: primary.mentor_code,
        mentor_codes: mentorCodes,
        name: primary.name,
        contact: primary.contact,
        email: primary.email,
        role: 'industry_mentor',
        jti: randomUUID()
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return ApiResponse.success(res, 'Industrial mentor login successful', {
      token,
      industrial_mentor_code: primary.industrial_mentor_code,
      mentor_code: primary.mentor_code,
      mentor_codes: mentorCodes,
      name: primary.name,
      contact: primary.contact,
      email: primary.email
    });
  });

  getIndustrialMentorGroups = asyncHandler(async (req, res) => {
    // Support both single mentor_code (legacy) and array mentor_codes
    const primaryMentorCode = req.user?.mentor_code;
    const tokenMentorCodes = Array.isArray(req.user?.mentor_codes) && req.user.mentor_codes.length > 0
      ? req.user.mentor_codes
      : (primaryMentorCode ? [primaryMentorCode] : []);

    let mentorCodes = tokenMentorCodes
      .map((code) => String(code || '').trim())
      .filter(Boolean);

    // Backward compatibility: old tokens or partial records may not include mentor_code(s).
    // Resolve linked mentor codes from DB using industrial mentor identity.
    if (mentorCodes.length === 0) {
      const industrialMentorCode = String(req.user?.industrial_mentor_code || '').trim();
      const contact = String(req.user?.contact || '').trim();
      const email = String(req.user?.email || '').trim().toLowerCase();

      let query = supabase.from('industrial_mentors').select('mentor_code');

      if (industrialMentorCode) {
        query = query.eq('industrial_mentor_code', industrialMentorCode);
      } else if (contact) {
        query = query.eq('contact', contact);
      } else if (email) {
        query = query.eq('email', email);
      }

      const { data: linkedMentorRows, error: linkedMentorError } = await query;
      if (linkedMentorError) throw linkedMentorError;

      mentorCodes = [...new Set((linkedMentorRows || [])
        .map((row) => String(row?.mentor_code || '').trim())
        .filter(Boolean))];
    }

    if (mentorCodes.length === 0) {
      throw ApiError.badRequest('No faculty mentor code is linked to this industry mentor');
    }

    // Fetch PBL rows for all linked faculties
    const { data: pblRows, error: pblError } = await supabase
      .from('pbl')
      .select('group_id, mentor_code')
      .in('mentor_code', mentorCodes);

    if (pblError) {
      throw pblError;
    }

    // Fetch mentor names for all linked faculties
    const { data: mentorRows, error: mentorError } = await supabase
      .from('mentors')
      .select('mentor_code, mentor_name')
      .in('mentor_code', mentorCodes);

    if (mentorError) {
      throw mentorError;
    }

    const mentorNameMap = {};
    (mentorRows || []).forEach((m) => {
      mentorNameMap[m.mentor_code] = m.mentor_name;
    });

    // Group groups by faculty
    const facultyMap = {};
    (pblRows || []).forEach((row) => {
      const code = row.mentor_code;
      if (!facultyMap[code]) {
        facultyMap[code] = {
          mentor_code: code,
          faculty_name: mentorNameMap[code] || code,
          groups: []
        };
      }
      if (!facultyMap[code].groups.includes(row.group_id)) {
        facultyMap[code].groups.push(row.group_id);
      }
    });

    const groupsByFaculty = Object.values(facultyMap);
    // Flat list for backward compatibility
    const groups = [...new Set((pblRows || []).map((row) => row.group_id))];

    return ApiResponse.success(res, 'Industrial mentor groups retrieved successfully', {
      groups,
      groupsByFaculty,
      mentor_code: primaryMentorCode,
      mentor_codes: mentorCodes
    });
  });
}

export default new IndustrialMentorAuthController();
