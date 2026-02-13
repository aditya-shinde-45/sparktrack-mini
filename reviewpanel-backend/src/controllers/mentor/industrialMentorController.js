import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import industrialMentorModel from '../../models/industrialMentorModel.js';
import emailService from '../../services/emailService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const buildCredentialsEmail = (name, loginId, password) => {
  const subject = 'Your SparkTrack Industrial Mentor Login Credentials';
  const text = `Dear ${name},

Your industrial mentor account has been created on SparkTrack (MIT ADT University).

Login ID: ${loginId}
Temporary Password: ${password}

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
                <p style="margin:20px 0 0; font-size:13px; color:#6b7280;">
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

class IndustrialMentorController {
  getIndustrialMentor = asyncHandler(async (req, res) => {
    const mentorCode = req.user?.mentor_id || req.user?.mentor_code;

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    const record = await industrialMentorModel.getByMentorCode(mentorCode);
    const { password, ...safeRecord } = record || {};

    return ApiResponse.success(res, 'Industrial mentor retrieved successfully.', {
      industrialMentor: record ? safeRecord : null
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

    const existing = await industrialMentorModel.getByMentorCode(mentorCode);
    if (existing) {
      throw ApiError.badRequest('Industrial mentor already exists for this mentor.');
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
      email: email || null,
      contact: contact || null,
      password: hashedPassword,
      mentor_code: mentorCode
    };

    const record = await industrialMentorModel.create(payload);

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
    const { name, company_name, designation, email, contact } = req.body || {};

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    const existing = await industrialMentorModel.getByMentorCode(mentorCode);
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

    if (!mentorCode) {
      throw ApiError.badRequest('Mentor code is required.');
    }

    const existing = await industrialMentorModel.getByMentorCode(mentorCode);
    if (!existing) {
      throw ApiError.notFound('Industrial mentor not found.');
    }

    await industrialMentorModel.deleteById(existing.id);

    return ApiResponse.success(res, 'Industrial mentor deleted successfully.');
  });
}

export default new IndustrialMentorController();
