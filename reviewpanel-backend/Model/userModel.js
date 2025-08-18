import bcrypt from "bcryptjs";

export const users = [
  {
    id: 1,
    username: "Suresh.kapare@mituniversity.com",
    passwordHash: bcrypt.hashSync("8698078603", 10), // hashed password
    role: "Admin",
  },
];
