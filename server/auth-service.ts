import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { UpsertUser, User } from "@shared/schema";

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Create a new GM account
   */
  static async signupGM(data: SignupData) {
    // Check if user already exists
    const existingUsers = await storage.getUserByEmail(data.email);
    if (existingUsers.length > 0) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const userData: UpsertUser = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
      authType: 'local',
      isGM: true,
    };

    return await storage.upsertUser(userData);
  }

  /**
   * Authenticate local user
   */
  static async authenticateLocal(data: LoginData) {
    // Find user by email
    const users = await storage.getUserByEmail(data.email);
    const user = users.find((u: User) => u.authType === 'local');
    
    if (!user || !user.passwordHash) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Verify password
    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Email ou mot de passe incorrect");
    }

    return user;
  }
}