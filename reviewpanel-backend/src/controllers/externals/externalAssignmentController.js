import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import externalAssignmentModel from '../../models/externalAssignmentModel.js';

/**
 * Controller responsible for assigning externals to classes/years
 */
class ExternalAssignmentController {
  assignExternal = asyncHandler(async (req, res) => {
    const {
      name,
      contact,
      id: external_id,
      email,
      year,
      syClass,
      tySpec,
      tyClassNo,
      lySpec,
      lyClassNo,
    } = req.body;

    if (!name || !contact || !external_id || !email || !year) {
      throw ApiError.badRequest('Name, contact, external ID, email, and year are required.');
    }

    const exists = await externalAssignmentModel.exists(external_id);
    if (exists) {
      throw ApiError.conflict('External with this ID already exists.');
    }

    const assignedClass = this.#buildAssignedClass(year, { syClass, tySpec, tyClassNo, lySpec, lyClassNo });

    const data = await externalAssignmentModel.assignExternal({
      name,
      contact,
      external_id,
      email,
      year,
      assignedClass,
    });

    return ApiResponse.success(res, 'External assigned successfully.', { data }, 201);
  });

  #buildAssignedClass(year, options) {
    const normalizedYear = year?.toUpperCase();

    if (normalizedYear === 'SY') {
      if (!options.syClass) {
        throw ApiError.badRequest('SY class is required for second-year assignment.');
      }
      return options.syClass;
    }

    if (normalizedYear === 'TY') {
      if (!options.tySpec || !options.tyClassNo) {
        throw ApiError.badRequest('TY specialization and class number are required.');
      }
      return `TY${options.tySpec}${options.tyClassNo}`;
    }

    if (normalizedYear === 'LY') {
      if (!options.lySpec || !options.lyClassNo) {
        throw ApiError.badRequest('LY specialization and class number are required.');
      }
      return `LY${options.lySpec}${options.lyClassNo}`;
    }

    throw ApiError.badRequest('Invalid year provided.');
  }
}

export default new ExternalAssignmentController();
