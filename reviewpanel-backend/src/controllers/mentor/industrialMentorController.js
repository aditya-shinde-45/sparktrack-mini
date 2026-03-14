import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import industrialMentorModel from '../../models/industrialMentorModel.js';
import emailService from '../../services/emailService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SPARKTRACK_URL = 'https://sparktrack-mini-8pjs.vercel.app/';

const buildCredentialsEmail = (name, loginId, password) => {
  const subject = 'Your SparkTrack Industrial Mentor Login Credentials';
  const text = `Dear ${name},

Your industrial mentor account has been created on SparkTrack (MIT ADT University).

Login ID: ${loginId}
Temporary Password: ${password}

Login here: ${SPARKTRACK_URL}

Please login and change your password after your first sign-in.

Regards,
SparkTrack Team
MIT ADT University`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SparkTrack Credentials</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f4fb; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(88, 74, 170, 0.18);">
            <tr>
              <td style="background:linear-gradient(135deg,#6b5bdf,#4c1d95); padding:28px; color:#ffffff;">
                <p style="margin:0; font-size:13px; letter-spacing:0.12em; text-transform:uppercase; color:#d9d4ff;">MIT ADT University</p>
                <h1 style="margin:10px 0 0; font-size:24px; font-weight:700;">SparkTrack Industrial Mentor</h1>
                <p style="margin:8px 0 0; font-size:14px; color:#efeaff;">Your login credentials are ready.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px; color:#1f2937;">
                <p style="margin:0 0 12px; font-size:16px;">Dear <strong>${name}</strong>,</p>
                <p style="margin:0 0 20px; font-size:14px; color:#4b5563;">
                  Your industrial mentor account has been created on SparkTrack. Use the credentials below to sign in.
                </p>
                <div style="background:#f3f0ff; border-radius:12px; padding:16px; border:1px solid #e5defa;">
                  <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b5bdf;">Login ID</p>
                  <p style="margin:0 0 16px; font-size:16px; font-weight:700; color:#1f2937;">${loginId}</p>
                  <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b5bdf;">Temporary Password</p>
                  <p style="margin:0; font-size:16px; font-weight:700; color:#1f2937;">${password}</p>
                </div>
                <div style="margin:24px 0; text-align:center;">
                  <a href="${SPARKTRACK_URL}" target="_blank"
                     style="display:inline-block; background:linear-gradient(135deg,#6b5bdf,#4c1d95); color:#ffffff;
                            text-decoration:none; padding:14px 32px; border-radius:10px; font-size:15px;
                            font-weight:700; letter-spacing:0.04em;">
                    Login to SparkTrack
                  </a>
                  <p style="margin:8px 0 0; font-size:12px; color:#9ca3af;">
                    or copy this link: <a href="${SPARKTRACK_URL}" style="color:#6b5bdf;">${SPARKTRACK_URL}</a>
                  </p>
                </div>
                <p style="margin:4px 0 0; font-size:13px; color:#6b7280;">
                  Please login and change your password after your first sign-in.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; background:#f9f7ff; color:#6b7280; font-size:12px;">
                <p style="margin:0;">SparkTrack | MIT ADT University</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
};

const buildLinkNotificationEmail = (name, loginId) => {
  const subject = 'SparkTrack – You have been added to a new class';
  const text = `Dear ${name},

You have been linked to an additional faculty class on SparkTrack (MIT ADT University).

You can continue to use your existing login credentials to access the portal:

Login ID: ${loginId}
Portal: ${SPARKTRACK_URL}

If you have any questions, please contact your faculty mentor.

Regards,
SparkTrack Team
MIT ADT University`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SparkTrack – New Class Access</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f4fb; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(88, 74, 170, 0.18);">
            <tr>
              <td style="background:linear-gradient(135deg,#6b5bdf,#4c1d95); padding:28px; color:#ffffff;">
                <p style="margin:0; font-size:13px; letter-spacing:0.12em; text-transform:uppercase; color:#d9d4ff;">MIT ADT University</p>
                <h1 style="margin:10px 0 0; font-size:24px; font-weight:700;">SparkTrack Industrial Mentor</h1>
                <p style="margin:8px 0 0; font-size:14px; color:#efeaff;">You have been added to a new class.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px; color:#1f2937;">
                <p style="margin:0 0 12px; font-size:16px;">Dear <strong>${name}</strong>,</p>
                <p style="margin:0 0 20px; font-size:14px; color:#4b5563;">
                  A faculty mentor has linked your account to their class on SparkTrack.
                  You can use your existing credentials to log in.
                </p>
                <div style="background:#f3f0ff; border-radius:12px; padding:16px; border:1px solid #e5defa;">
                  <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b5bdf;">Login ID</p>
                  <p style="margin:0; font-size:16px; font-weight:700; color:#1f2937;">${loginId}</p>
                </div>
                <div style="margin:24px 0; text-align:center;">
                  <a href="${SPARKTRACK_URL}" target="_blank"
                     style="display:inline-block; background:linear-gradient(135deg,#6b5bdf,#4c1d95); color:#ffffff;
                            text-decoration:none; padding:14px 32px; border-radius:10px; font-size:15px;
                            font-weight:700; letter-spacing:0.04em;">
                    Login to SparkTrack
                  </a>
                  <p style="margin:8px 0 0; font-size:12px; color:#9ca3af;">
                    or copy this link: <a href="${SPARKTRACK_URL}" style="color:#6b5bdf;">${SPARKTRACK_URL}</a>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; background:#f9f7ff; color:#6b7280; font-size:12px;">
                <p style="margin:0;">SparkTrack | MIT ADT University</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
};

class IndustrialMentorController {
  getIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    const records = await industrialMentorModel.getByMentorCode(mentorCode);

    // Linked rows store email: null to avoid the UNIQUE DB constraint.
    // Resolve the real email by looking up any other row with the same contact.
    const resolvedRecords = await Promise.all(
      records.map(async (record) => {
        if (!record.email && record.contact) {
          const source = await industrialMentorModel.getOneByContact(record.contact);
          if (source && source.email) {
            return { ...record, email: source.email };
          }
        }
        return record;
      })
    );

    const safeRecords = resolvedRecords.map(({ password, ...rest }) => rest);

    return ApiResponse.success(res, 'Industrial mentors retrieved successfully.', {
      industrialMentors: safeRecords
    });
  });

  createIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;
    const { name, company_name, designation, email, contact } = req.body || {};

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    if (!name) {
      throw ApiError.badRequest('Name is required.');
    }

    if (!email) {
      throw ApiError.badRequest('Email is required.');
    }

    if (!contact) {
      throw ApiError.badRequest('Contact is required.');
    }

    // Check if an industrial mentor with this email already exists anywhere
    const existingByEmail = email
      ? await industrialMentorModel.getByEmail(email.trim().toLowerCase())
      : [];

    if (existingByEmail.length > 0) {
      // Check if already linked to THIS faculty
      const alreadyForThisFaculty = existingByEmail.some(
        (r) => r.mentor_code === mentorCode
      );
      if (alreadyForThisFaculty) {
        throw ApiError.badRequest(
          'An industrial mentor with this email is already linked to your class.'
        );
      }

      // Linked to a DIFFERENT faculty — cannot auto-link until DB unique constraint on
      // email is dropped. Return a structured error so the frontend can prompt the user.
      const source = existingByEmail[0];
      const safeSource = (({ password: _p, ...rest }) => rest)(source);
      throw Object.assign(
        ApiError.badRequest(
          `This email already belongs to industrial mentor "${source.name}" ` +
          `(code: ${source.industrial_mentor_code}). ` +
          `Use the "Link Existing" option and enter their code or contact number to add them to your class.`
        ),
        { existingMentor: safeSource }
      );
    }

    const industrialMentorCode = await industrialMentorModel.getNextIndustrialMentorCode();

    const baseName = String(name || 'mentor')
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8) || 'mentor';
    const randomSuffix = crypto.randomInt(1000, 9999);
    const plainPassword = `${baseName}@sparktrack${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const payload = {
      industrial_mentor_code: industrialMentorCode,
      name,
      company_name: company_name || null,
      designation: designation || null,
      email: email ? email.trim().toLowerCase() : null,
      contact: contact || null,
      password: hashedPassword,
      mentor_code: mentorCode
    };

    let record;
    try {
      record = await industrialMentorModel.create(payload);
    } catch (err) {
      if (err.isUniqueViolation) {
        throw ApiError.badRequest(
          'An industrial mentor with this email or contact already exists. ' +
          'Use "Link Existing" to add them to your class instead.'
        );
      }
      throw err;
    }

    const loginId = String(contact).trim();
    const { subject, text, html } = buildCredentialsEmail(name, loginId, plainPassword);
    await emailService.sendMail(email, subject, text, html);

    const { password, ...safeRecord } = record || {};

    return ApiResponse.success(res, 'Industrial mentor created successfully.', {
      industrialMentor: safeRecord
    }, 201);
  });

  updateIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;
    const { industrial_mentor_code } = req.params;
    const { name, company_name, designation, email, contact } = req.body || {};

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    if (!industrial_mentor_code) {
      throw ApiError.badRequest('Industrial mentor code is required.');
    }

    const allForMentor = await industrialMentorModel.getByMentorCode(mentorCode);
    const existing = allForMentor.find(
      (r) => r.industrial_mentor_code === industrial_mentor_code
    );
    if (!existing) {
      throw ApiError.notFound('Industrial mentor not found.');
    }

    const updates = {
      name: name ?? existing.name,
      company_name: company_name ?? existing.company_name,
      designation: designation ?? existing.designation,
      email: email ?? existing.email,
      contact: contact ?? existing.contact
    };

    let plainPassword = null;
    const emailChanged = email && email !== existing.email;
    if (emailChanged) {
      const baseName = String(updates.name || 'mentor')
        .split(' ')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8) || 'mentor';
      const randomSuffix = crypto.randomInt(1000, 9999);
      plainPassword = `${baseName}@sparktrack${randomSuffix}`;
      updates.password = await bcrypt.hash(plainPassword, 10);
    }

    const record = await industrialMentorModel.update(existing.id, updates);
    if (emailChanged && plainPassword) {
      const loginId = String(updates.contact || '').trim();
      const { subject, text, html } = buildCredentialsEmail(updates.name || 'Mentor', loginId, plainPassword);
      await emailService.sendMail(updates.email, subject, text, html);
    }
    const { password, ...safeRecord } = record || {};

    return ApiResponse.success(res, 'Industrial mentor updated successfully.', {
      industrialMentor: safeRecord
    });
  });

  deleteIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;
    const { industrial_mentor_code } = req.params;

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    if (!industrial_mentor_code) {
      throw ApiError.badRequest('Industrial mentor code is required.');
    }

    const allForMentor = await industrialMentorModel.getByMentorCode(mentorCode);
    const existing = allForMentor.find(
      (r) => r.industrial_mentor_code === industrial_mentor_code
    );
    if (!existing) {
      throw ApiError.notFound('Industrial mentor not found.');
    }

    await industrialMentorModel.deleteById(existing.id);

    return ApiResponse.success(res, 'Industrial mentor deleted successfully.');
  });

  // Search an existing industry mentor by their code, contact number, or name
  // so the faculty can preview before linking
  searchIndustrialMentor = asyncHandler(async (req, res) => {
    const { query } = req.query; // industrial_mentor_code, contact, or name

    if (!query) {
      throw ApiError.badRequest('Search query (code, contact, or name) is required.');
    }

    // 1. Try exact code match
    let record = await industrialMentorModel.getByIndustrialMentorCode(query.trim().toUpperCase());

    // 2. Try contact match
    if (!record) {
      record = await industrialMentorModel.getOneByContact(query.trim());
    }

    // 3. If exact match found, return single result
    if (record) {
      // Resolve email if this is a linked row (email: null)
      if (!record.email && record.contact) {
        const source = await industrialMentorModel.getOneByContact(record.contact);
        if (source && source.email) {
          record = { ...record, email: source.email };
        }
      }
      const { password, ...safe } = record;
      return ApiResponse.success(res, 'Industry mentor found.', { industrialMentor: safe, results: [] });
    }

    // 4. Fall back to name search — return list for dropdown
    const nameResults = await industrialMentorModel.searchByName(query.trim());
    if (!nameResults || nameResults.length === 0) {
      throw ApiError.notFound('No industry mentor found with that code, contact, or name.');
    }

    const safeResults = nameResults.map(({ password, ...rest }) => rest);
    return ApiResponse.success(res, 'Industry mentors found.', { industrialMentor: null, results: safeResults });
  });

  // Link an existing industry mentor to the current faculty's class.
  // Creates a new row with the current faculty's mentor_code but copies credentials.
  linkIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;
    const { industrial_mentor_code } = req.body || {};

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }
    if (!industrial_mentor_code) {
      throw ApiError.badRequest('industrial_mentor_code of the mentor to link is required.');
    }

    // Find the source record
    const source = await industrialMentorModel.getByIndustrialMentorCode(
      industrial_mentor_code.trim().toUpperCase()
    );
    if (!source) {
      throw ApiError.notFound('Industry mentor not found.');
    }

    // Check not already linked to this faculty
    const existing = await industrialMentorModel.getByMentorCode(mentorCode);
    const alreadyLinked = existing.some(
      (r) => r.contact === source.contact
    );
    if (alreadyLinked) {
      throw ApiError.badRequest('This industry mentor is already linked to your class.');
    }

    // Generate a new code for the new linkage row
    const newCode = await industrialMentorModel.getNextIndustrialMentorCode();

    const payload = {
      industrial_mentor_code: newCode,
      name: source.name,
      company_name: source.company_name || null,
      designation: source.designation || null,
      // Set email to null on linked rows to avoid the UNIQUE(email) DB constraint.
      // Login uses contact number, so credentials still work across all linked faculty classes.
      email: null,
      contact: source.contact || null,
      password: source.password, // reuse the hashed password — same credentials
      mentor_code: mentorCode
    };

    let record;
    try {
      record = await industrialMentorModel.create(payload);
    } catch (err) {
      if (err.isUniqueViolation) {
        throw ApiError.badRequest(
          'This mentor is already linked to your class. ' +
          'If the unique constraint error persists, run the migration: drop_email_unique_industrial_mentors.sql'
        );
      }
      throw err;
    }
    const { password, ...safe } = record;

    // Send notification email to the mentor's original email (stored on source row)
    if (source.email) {
      try {
        const loginId = String(source.contact || '').trim();
        const { subject, text, html } = buildLinkNotificationEmail(source.name, loginId);
        await emailService.sendMail(source.email, subject, text, html);
      } catch (emailErr) {
        console.error('Link notification email failed (non-fatal):', emailErr.message);
      }
    }

    return ApiResponse.success(
      res,
      'Industry mentor linked to your class successfully.',
      { industrialMentor: safe },
      201
    );
  });
}

export default new IndustrialMentorController();
