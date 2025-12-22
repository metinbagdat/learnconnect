import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export default async function createAdminAccount(username: string, password: string, displayName: string) {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return { success: false, message: "User already exists" };
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the admin user
    const admin = await storage.createUser({
      username,
      password: hashedPassword,
      displayName,
      role: "admin",
      interests: [],
      avatarUrl: null
    });
    
    // Return success without the password
    const { password: _, ...adminWithoutPassword } = admin;
    return { 
      success: true, 
      message: "Admin account created successfully", 
      admin: adminWithoutPassword 
    };
  } catch (error) {
    console.error("Failed to create admin account:", error);
    return { success: false, message: "Failed to create admin account" };
  }
}