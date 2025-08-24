import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game sessions
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code", { length: 6 }).unique(),
  gmId: varchar("gm_id").notNull().references(() => users.id),
  status: varchar("status").default('preparation'), // 'preparation', 'active', 'ended'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Characters
export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Can be null for player characters without accounts
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  name: varchar("name").notNull(),
  occupation: varchar("occupation").notNull(),
  age: integer("age"),
  birthplace: varchar("birthplace"),
  residence: varchar("residence"),
  gender: varchar("gender"),
  
  // Core characteristics
  strength: integer("strength").notNull(),
  constitution: integer("constitution").notNull(),
  size: integer("size").notNull(),
  dexterity: integer("dexterity").notNull(),
  appearance: integer("appearance").notNull(),
  intelligence: integer("intelligence").notNull(),
  power: integer("power").notNull(),
  education: integer("education").notNull(),
  luck: integer("luck").notNull(),
  
  // Derived stats
  hitPoints: integer("hit_points").notNull(),
  maxHitPoints: integer("max_hit_points").notNull(),
  sanity: integer("sanity").notNull(),
  maxSanity: integer("max_sanity").notNull(),
  magicPoints: integer("magic_points").notNull(),
  maxMagicPoints: integer("max_magic_points").notNull(),
  
  // Avatar
  avatarUrl: varchar("avatar_url"),
  avatarPrompt: text("avatar_prompt"),
  
  // Skills (stored as JSON for flexibility)
  skills: jsonb("skills").notNull().default('{}'),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sanity conditions (phobias, manias, etc.)
export const sanityConditions = pgTable("sanity_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  type: varchar("type").notNull(), // 'phobia', 'mania', 'temporary_insanity', 'indefinite_insanity'
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  duration: varchar("duration"), // 'temporary', 'indefinite', 'permanent'
  createdAt: timestamp("created_at").defaultNow(),
});

// Active effects (buffs, debuffs, conditions)
export const activeEffects = pgTable("active_effects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  appliedBy: varchar("applied_by").references(() => users.id), // GM who applied it
  type: varchar("type").notNull(), // 'buff', 'debuff', 'damage', 'sanity_loss'
  name: varchar("name").notNull(),
  description: text("description"),
  value: varchar("value"), // dice formula or static value
  isActive: boolean("is_active").default(true),
  duration: integer("duration"), // rounds, hours, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Dice roll history
export const rollHistory = pgTable("roll_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  characterId: varchar("character_id").references(() => characters.id),
  sessionId: varchar("session_id").references(() => gameSessions.id),
  rollType: varchar("roll_type").notNull(), // 'skill', 'sanity', 'damage', 'custom'
  skillName: varchar("skill_name"),
  skillValue: integer("skill_value"),
  diceFormula: varchar("dice_formula").notNull(),
  result: integer("result").notNull(),
  outcome: varchar("outcome"), // 'success', 'failure', 'extreme_success', 'hard_success'
  isGmRoll: boolean("is_gm_roll").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  gmSessions: many(gameSessions),
  rollHistory: many(rollHistory),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  gm: one(users, {
    fields: [gameSessions.gmId],
    references: [users.id],
  }),
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  session: one(gameSessions, {
    fields: [characters.sessionId],
    references: [gameSessions.id],
  }),
  sanityConditions: many(sanityConditions),
  activeEffects: many(activeEffects),
  rollHistory: many(rollHistory),
}));

export const sanityConditionsRelations = relations(sanityConditions, ({ one }) => ({
  character: one(characters, {
    fields: [sanityConditions.characterId],
    references: [characters.id],
  }),
}));

export const activeEffectsRelations = relations(activeEffects, ({ one }) => ({
  character: one(characters, {
    fields: [activeEffects.characterId],
    references: [characters.id],
  }),
  appliedBy: one(users, {
    fields: [activeEffects.appliedBy],
    references: [users.id],
  }),
}));

export const rollHistoryRelations = relations(rollHistory, ({ one }) => ({
  user: one(users, {
    fields: [rollHistory.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [rollHistory.characterId],
    references: [characters.id],
  }),
  session: one(gameSessions, {
    fields: [rollHistory.sessionId],
    references: [gameSessions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSanityConditionSchema = createInsertSchema(sanityConditions).omit({
  id: true,
  createdAt: true,
});

export const insertActiveEffectSchema = createInsertSchema(activeEffects).omit({
  id: true,
  createdAt: true,
});

export const insertRollHistorySchema = createInsertSchema(rollHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type SanityCondition = typeof sanityConditions.$inferSelect;
export type InsertSanityCondition = z.infer<typeof insertSanityConditionSchema>;
export type ActiveEffect = typeof activeEffects.$inferSelect;
export type InsertActiveEffect = z.infer<typeof insertActiveEffectSchema>;
export type RollHistory = typeof rollHistory.$inferSelect;
export type InsertRollHistory = z.infer<typeof insertRollHistorySchema>;
