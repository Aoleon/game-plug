import {
  users,
  gameSessions,
  characters,
  sanityConditions,
  activeEffects,
  rollHistory,
  type User,
  type UpsertUser,
  type GameSession,
  type InsertGameSession,
  type Character,
  type InsertCharacter,
  type SanityCondition,
  type InsertSanityCondition,
  type ActiveEffect,
  type InsertActiveEffect,
  type RollHistory,
  type InsertRollHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Game session operations
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  getGameSessionByCode(code: string): Promise<GameSession | undefined>;
  getGameSessionsByGM(gmId: string): Promise<GameSession[]>;
  updateGameSession(id: string, data: Partial<InsertGameSession>): Promise<GameSession>;
  deleteGameSession(id: string): Promise<void>;
  
  // Character operations
  createCharacter(character: InsertCharacter): Promise<Character>;
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersBySession(sessionId: string): Promise<Character[]>;
  getCharactersByUser(userId: string): Promise<Character[]>;
  updateCharacter(id: string, data: Partial<InsertCharacter>): Promise<Character>;
  
  // Sanity condition operations
  addSanityCondition(condition: InsertSanityCondition): Promise<SanityCondition>;
  getCharacterSanityConditions(characterId: string): Promise<SanityCondition[]>;
  updateSanityCondition(id: string, data: Partial<InsertSanityCondition>): Promise<SanityCondition>;
  
  // Active effect operations
  addActiveEffect(effect: InsertActiveEffect): Promise<ActiveEffect>;
  getCharacterActiveEffects(characterId: string): Promise<ActiveEffect[]>;
  updateActiveEffect(id: string, data: Partial<InsertActiveEffect>): Promise<ActiveEffect>;
  
  // Roll history operations
  addRollHistory(roll: InsertRollHistory): Promise<RollHistory>;
  getSessionRollHistory(sessionId: string, limit?: number): Promise<RollHistory[]>;
  getCharacterRollHistory(characterId: string, limit?: number): Promise<RollHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Game session operations
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const [gameSession] = await db
      .insert(gameSessions)
      .values(session)
      .returning();
    return gameSession;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, id));
    return session;
  }

  async getGameSessionByCode(code: string): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.code, code));
    return session;
  }

  async getGameSessionsByGM(gmId: string): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.gmId, gmId))
      .orderBy(desc(gameSessions.createdAt));
  }

  async updateGameSession(id: string, data: Partial<InsertGameSession>): Promise<GameSession> {
    const [session] = await db
      .update(gameSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }

  async deleteGameSession(id: string): Promise<void> {
    // Delete all related data first
    const sessionCharacters = await this.getCharactersBySession(id);
    for (const character of sessionCharacters) {
      await db.delete(sanityConditions).where(eq(sanityConditions.characterId, character.id));
      await db.delete(activeEffects).where(eq(activeEffects.characterId, character.id));
      await db.delete(rollHistory).where(eq(rollHistory.characterId, character.id));
    }
    await db.delete(characters).where(eq(characters.sessionId, id));
    await db.delete(rollHistory).where(eq(rollHistory.sessionId, id));
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  }

  // Character operations
  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [newCharacter] = await db
      .insert(characters)
      .values(character)
      .returning();
    return newCharacter;
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, id));
    return character;
  }

  async getCharactersBySession(sessionId: string): Promise<Character[]> {
    return await db
      .select()
      .from(characters)
      .where(and(eq(characters.sessionId, sessionId), eq(characters.isActive, true)))
      .orderBy(desc(characters.createdAt));
  }

  async getCharactersByUser(userId: string): Promise<Character[]> {
    return await db
      .select()
      .from(characters)
      .where(and(eq(characters.userId, userId), eq(characters.isActive, true)))
      .orderBy(desc(characters.createdAt));
  }

  async updateCharacter(id: string, data: Partial<InsertCharacter>): Promise<Character> {
    const [character] = await db
      .update(characters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return character;
  }

  // Sanity condition operations
  async addSanityCondition(condition: InsertSanityCondition): Promise<SanityCondition> {
    const [newCondition] = await db
      .insert(sanityConditions)
      .values(condition)
      .returning();
    return newCondition;
  }

  async getCharacterSanityConditions(characterId: string): Promise<SanityCondition[]> {
    return await db
      .select()
      .from(sanityConditions)
      .where(and(eq(sanityConditions.characterId, characterId), eq(sanityConditions.isActive, true)))
      .orderBy(desc(sanityConditions.createdAt));
  }

  async updateSanityCondition(id: string, data: Partial<InsertSanityCondition>): Promise<SanityCondition> {
    const [condition] = await db
      .update(sanityConditions)
      .set(data)
      .where(eq(sanityConditions.id, id))
      .returning();
    return condition;
  }

  // Active effect operations
  async addActiveEffect(effect: InsertActiveEffect): Promise<ActiveEffect> {
    const [newEffect] = await db
      .insert(activeEffects)
      .values(effect)
      .returning();
    return newEffect;
  }

  async getCharacterActiveEffects(characterId: string): Promise<ActiveEffect[]> {
    return await db
      .select()
      .from(activeEffects)
      .where(and(eq(activeEffects.characterId, characterId), eq(activeEffects.isActive, true)))
      .orderBy(desc(activeEffects.createdAt));
  }

  async updateActiveEffect(id: string, data: Partial<InsertActiveEffect>): Promise<ActiveEffect> {
    const [effect] = await db
      .update(activeEffects)
      .set(data)
      .where(eq(activeEffects.id, id))
      .returning();
    return effect;
  }

  // Roll history operations
  async addRollHistory(roll: InsertRollHistory): Promise<RollHistory> {
    const [newRoll] = await db
      .insert(rollHistory)
      .values(roll)
      .returning();
    return newRoll;
  }

  async getSessionRollHistory(sessionId: string, limit: number = 50): Promise<RollHistory[]> {
    return await db
      .select()
      .from(rollHistory)
      .where(eq(rollHistory.sessionId, sessionId))
      .orderBy(desc(rollHistory.createdAt))
      .limit(limit);
  }

  async getCharacterRollHistory(characterId: string, limit: number = 50): Promise<RollHistory[]> {
    return await db
      .select()
      .from(rollHistory)
      .where(eq(rollHistory.characterId, characterId))
      .orderBy(desc(rollHistory.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
