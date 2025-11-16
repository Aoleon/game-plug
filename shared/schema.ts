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

// User storage table (supports both Replit Auth and local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Local authentication fields
  passwordHash: varchar("password_hash"), // For local GM accounts
  authType: varchar("auth_type").default('replit'), // 'replit' or 'local'
  isGM: boolean("is_gm").default(false), // Flag to identify GMs
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
  skillsLocked: boolean("skills_locked").default(false), // Lock skills after initial creation
  availableSkillPoints: integer("available_skill_points").default(0), // Points available to distribute
  
  // Player notes
  notes: text("notes"),
  
  // Money
  money: decimal("money", { precision: 10, scale: 2 }).default('0.00'),
  
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

// Character inventory - items carried or equipped
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull().references(() => characters.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'weapon', 'armor', 'tool', 'book', 'misc'
  quantity: integer("quantity").default(1),
  weight: integer("weight").default(1), // weight units
  isEquipped: boolean("is_equipped").default(false),
  damage: varchar("damage"), // dice formula for weapons (e.g., "1d6+2")
  armor: integer("armor"), // armor value for armor items
  properties: jsonb("properties").default('{}'), // Additional properties like range, ammo, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chapters - subdivisions of game sessions
export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  name: varchar("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  status: varchar("status").default('planned'), // 'planned', 'active', 'completed'
  notes: text("notes"), // GM notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chapter events - complete history of what happens in a chapter
export const chapterEvents = pgTable("chapter_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").notNull().references(() => chapters.id),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  eventType: varchar("event_type").notNull(), // 'roll', 'narration', 'decision', 'sanity', 'combat', 'discovery', 'milestone'
  title: varchar("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default('{}'), // Store additional data like roll results, character involved, etc.
  characterId: varchar("character_id").references(() => characters.id),
  userId: varchar("user_id").references(() => users.id),
  isImportant: boolean("is_important").default(false), // Mark key events
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

// Narrative entries - GM's narrative journal for session
export const narrativeEntries = pgTable("narrative_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => gameSessions.id),
  gmId: varchar("gm_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  entryType: varchar("entry_type").default('note'), // 'note', 'event', 'npc', 'location', 'clue'
  isAiGenerated: boolean("is_ai_generated").default(false),
  metadata: jsonb("metadata").default('{}'), // For additional data like related characters, locations, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  chapters: many(chapters),
  narrativeEntries: many(narrativeEntries),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  session: one(gameSessions, {
    fields: [chapters.sessionId],
    references: [gameSessions.id],
  }),
  events: many(chapterEvents),
}));

export const chapterEventsRelations = relations(chapterEvents, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterEvents.chapterId],
    references: [chapters.id],
  }),
  session: one(gameSessions, {
    fields: [chapterEvents.sessionId],
    references: [gameSessions.id],
  }),
  character: one(characters, {
    fields: [chapterEvents.characterId],
    references: [characters.id],
  }),
  user: one(users, {
    fields: [chapterEvents.userId],
    references: [users.id],
  }),
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
  inventory: many(inventory),
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

export const inventoryRelations = relations(inventory, ({ one }) => ({
  character: one(characters, {
    fields: [inventory.characterId],
    references: [characters.id],
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

export const narrativeEntriesRelations = relations(narrativeEntries, ({ one }) => ({
  session: one(gameSessions, {
    fields: [narrativeEntries.sessionId],
    references: [gameSessions.id],
  }),
  gm: one(users, {
    fields: [narrativeEntries.gmId],
    references: [users.id],
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

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChapterEventSchema = createInsertSchema(chapterEvents).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNarrativeEntrySchema = createInsertSchema(narrativeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Local signup schema for GMs
export const gmSignupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

// Local login schema
export const localLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
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
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type ChapterEvent = typeof chapterEvents.$inferSelect;
export type InsertChapterEvent = z.infer<typeof insertChapterEventSchema>;
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;
export type NarrativeEntry = typeof narrativeEntries.$inferSelect;
export type InsertNarrativeEntry = z.infer<typeof insertNarrativeEntrySchema>;
