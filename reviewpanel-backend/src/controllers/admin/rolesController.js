import supabase from "../../config/database.js";
import ApiResponse from "../../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import config from "../../config/index.js";
import { validatePassword } from "../../utils/passwordValidator.js";

/**
 * Create a new role
 */
export const createRole = async (req, res) => {
  try {
    const { userId, password, tablePermissions } = req.body;

    // Validation
    if (!userId || !password || !tablePermissions || !Array.isArray(tablePermissions)) {
      return ApiResponse.error(res, "Missing required fields", 400);
    }

    if (userId.length < 4) {
      return ApiResponse.error(res, "User ID must be at least 4 characters", 400);
    }

    if (password.length < 6) {
      return ApiResponse.error(res, "Password must be at least 6 characters", 400);
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return ApiResponse.error(res, pwCheck.message, 400);
    }

    if (tablePermissions.length === 0) {
      return ApiResponse.error(res, "At least one table permission is required", 400);
    }

    // Validate table permissions
    const validTables = [
      "students",
      "pbl",
      "mentors",
      "evaluation_form_submission",
      "industrial_mentors"
    ];
    const invalidTables = tablePermissions.filter(table => !validTables.includes(table));
    if (invalidTables.length > 0) {
      return ApiResponse.error(res, `Invalid table permissions: ${invalidTables.join(", ")}`, 400);
    }

    // Check if user_id already exists
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      return ApiResponse.error(res, "User ID already exists", 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert role
    const { data: newRole, error } = await supabase
      .from("roles")
      .insert({
        user_id: userId,
        password_hash: passwordHash,
        table_permissions: tablePermissions,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating role:", error);
      return ApiResponse.error(res, "Failed to create role", 500);
    }

    // Remove password_hash from response
    const { password_hash, ...roleData } = newRole;

    return ApiResponse.success(res, "Role created successfully", roleData, 201);
  } catch (error) {
    console.error("Error in createRole:", error);
    return ApiResponse.error(res, error.message || "Failed to create role", 500);
  }
};

/**
 * Get all roles
 */
export const getAllRoles = async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("id, user_id, table_permissions, is_active, created_at, last_login")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching roles:", error);
      return ApiResponse.error(res, "Failed to fetch roles", 500);
    }

    return ApiResponse.success(res, "Roles retrieved successfully", roles);
  } catch (error) {
    console.error("Error in getAllRoles:", error);
    return ApiResponse.error(res, error.message || "Failed to fetch roles", 500);
  }
};

/**
 * Get single role by ID
 */
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: role, error } = await supabase
      .from("roles")
      .select("id, user_id, table_permissions, is_active, created_at, last_login")
      .eq("id", id)
      .single();

    if (error || !role) {
      return ApiResponse.error(res, "Role not found", 404);
    }

    return ApiResponse.success(res, "Role retrieved successfully", role);
  } catch (error) {
    console.error("Error in getRoleById:", error);
    return ApiResponse.error(res, error.message || "Failed to fetch role", 500);
  }
};

/**
 * Update role
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, tablePermissions, password, isActive } = req.body;

    // Check if role exists
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existingRole) {
      return ApiResponse.error(res, "Role not found", 404);
    }

    // Build update object
    const updateData = {};

    if (userId !== undefined) {
      if (userId.length < 4) {
        return ApiResponse.error(res, "User ID must be at least 4 characters", 400);
      }

      // Check if new userId already exists (if changed)
      if (userId !== existingRole.user_id) {
        const { data: duplicateRole } = await supabase
          .from("roles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (duplicateRole) {
          return ApiResponse.error(res, "User ID already exists", 409);
        }
      }

      updateData.user_id = userId;
    }

    if (tablePermissions !== undefined) {
      if (!Array.isArray(tablePermissions) || tablePermissions.length === 0) {
        return ApiResponse.error(res, "At least one table permission is required", 400);
      }

      // Validate table permissions
      const validTables = [
        "students",
        "pbl",
        "mentors",
        "evaluation_form_submission",
        "industrial_mentors"
      ];
      const invalidTables = tablePermissions.filter(table => !validTables.includes(table));
      if (invalidTables.length > 0) {
        return ApiResponse.error(res, `Invalid table permissions: ${invalidTables.join(", ")}`, 400);
      }

      updateData.table_permissions = tablePermissions;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return ApiResponse.error(res, "Password must be at least 6 characters", 400);
      }

      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        return ApiResponse.error(res, pwCheck.message, 400);
      }

      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    // Update role
    const { data: updatedRole, error } = await supabase
      .from("roles")
      .update(updateData)
      .eq("id", id)
      .select("id, user_id, table_permissions, is_active, created_at, last_login")
      .single();

    if (error) {
      console.error("Error updating role:", error);
      return ApiResponse.error(res, "Failed to update role", 500);
    }

    return ApiResponse.success(res, "Role updated successfully", updatedRole);
  } catch (error) {
    console.error("Error in updateRole:", error);
    return ApiResponse.error(res, error.message || "Failed to update role", 500);
  }
};

/**
 * Delete role
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingRole) {
      return ApiResponse.error(res, "Role not found", 404);
    }

    // Delete role
    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting role:", error);
      return ApiResponse.error(res, "Failed to delete role", 500);
    }

    return ApiResponse.success(res, "Role deleted successfully");
  } catch (error) {
    console.error("Error in deleteRole:", error);
    return ApiResponse.error(res, error.message || "Failed to delete role", 500);
  }
};

/**
 * Role login
 */
export const roleLogin = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return ApiResponse.error(res, "User ID and password are required", 400);
    }

    // Get role
    const { data: role, error } = await supabase
      .from("roles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 404 = user does not exist in roles table at all (frontend should try regular admin login)
    if (error || !role) {
      return ApiResponse.error(res, "User not found in roles", 404);
    }

    // Check if active
    if (!role.is_active) {
      return ApiResponse.error(res, "Account is disabled", 403);
    }

    // Verify password — 401 = user exists but password is wrong
    const isPasswordValid = await bcrypt.compare(password, role.password_hash);
    if (!isPasswordValid) {
      return ApiResponse.error(res, "Invalid credentials", 401);
    }

    // Update last_login
    await supabase
      .from("roles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", role.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: role.id,
        user_id: role.user_id,
        username: role.user_id,
        role: "admin",
        isRoleBased: true,
        tablePermissions: role.table_permissions,
        jti: randomUUID()
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn || "7d" }
    );

    // Remove password_hash from response
    const { password_hash, ...roleData } = role;

    return ApiResponse.success(res, "Login successful", {
      token,
      user: {
        id: role.id,
        user_id: role.user_id,
        username: role.user_id,
        role: "admin",
        tablePermissions: role.table_permissions
      },
      role: roleData
    });
  } catch (error) {
    console.error("Error in roleLogin:", error);
    return ApiResponse.error(res, error.message || "Login failed", 500);
  }
};
