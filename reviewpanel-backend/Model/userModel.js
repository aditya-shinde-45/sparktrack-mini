import bcrypt from "bcryptjs";

export const users = [
  {
    id: 1,
    username: "admin",
    passwordHash: bcrypt.hashSync("admin1230", 10), // hashed password
    role: "Admin",
  },
];
