import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export async function authenticateUser(username: string, password: string) {
  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (user.length === 0) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, user[0].passwordHash);
  
  if (!validPassword) {
    return null;
  }

  if (!user[0].active) {
    return null;
  }

  return user[0];
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
