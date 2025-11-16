import type { Express } from "express";
import { broadcastToSession } from "./websocket";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateCharacterAvatar, generatePhobiaDescription, generateManiaDescription, generateSceneImage, generateNarrativeSuggestion } from "./openai";
import { copyAvatar, avatarFileExists } from "./image-storage";
import { migrateExistingAvatars } from "./migrate-avatars";
import { applyAutomaticStatusEffects, calculateSanityLoss, applyTemporaryInsanity } from "./game-logic";
import { applyHealing, applySanityRecovery, applyMagicRecovery, applyLuckBoost, applySkillBonus } from "./buff-logic";
import {
  insertGameSessionSchema,
  insertCharacterSchema,
  insertSanityConditionSchema,
  insertActiveEffectSchema,
  insertRollHistorySchema,
  insertChapterSchema,
  insertInventorySchema,
  gmSignupSchema,
  localLoginSchema,
} from "@shared/schema";
import { AuthService } from "./auth-service";
import { z } from "zod";

// Generate a unique session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerRoutes(app: Express): Promise<void> {
  // Health check endpoint for deployment  
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local GM signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const signupData = gmSignupSchema.parse(req.body);
      const user = await AuthService.signupGM(signupData);
      
      // Create session for the new user
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        authType: 'local'
      };
      
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isGM: user.isGM,
          authType: user.authType
        }
      });
    } catch (error) {
      console.error("Error during signup:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de l'inscription";
      res.status(400).json({ message });
    }
  });

  // Local login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = localLoginSchema.parse(req.body);
      const user = await AuthService.authenticateLocal(loginData);
      
      // Create session for the authenticated user
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        authType: 'local'
      };
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isGM: user.isGM,
          authType: user.authType
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de la connexion";
      res.status(401).json({ message });
    }
  });

  // Public route to join a session with code
  app.get('/api/sessions/join/:code', async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const session = await storage.getGameSessionByCode(code);
      
      if (!session || session.status !== 'active') {
        return res.status(404).json({ message: "Session not found or inactive" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error joining session:", error);
      res.status(500).json({ message: "Failed to join session" });
    }
  });

  // Helper to get userId from either OIDC or local auth
  const getUserId = (req: any): string => {
    return req.user.claims ? req.user.claims.sub : req.user.id;
  };

  // Game session routes
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sessionData = insertGameSessionSchema.parse({
        ...req.body,
        gmId: userId,
        code: generateSessionCode(),
        status: 'active'
      });
      const session = await storage.createGameSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(400).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getGameSessionsByGM(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.patch('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updatedSession = await storage.updateGameSession(req.params.id, req.body);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deleteGameSession(req.params.id);
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  app.get('/api/sessions/:id/characters', async (req, res) => {
    try {
      const characters = await storage.getCharactersBySession(req.params.id);
      
      // Get sanity conditions and active effects for each character
      const charactersWithDetails = await Promise.all(
        characters.map(async (character) => {
          const [sanityConditions, activeEffects] = await Promise.all([
            storage.getCharacterSanityConditions(character.id),
            storage.getCharacterActiveEffects(character.id)
          ]);
          return { ...character, sanityConditions, activeEffects };
        })
      );
      
      res.json(charactersWithDetails);
    } catch (error) {
      console.error("Error fetching session characters:", error);
      res.status(500).json({ message: "Failed to fetch session characters" });
    }
  });

  // Chapter routes (GM only)
  app.post('/api/sessions/:sessionId/chapters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const session = await storage.getGameSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const chapterData = insertChapterSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId
      });
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(400).json({ message: "Failed to create chapter" });
    }
  });

  app.get('/api/sessions/:sessionId/chapters', async (req, res) => {
    try {
      const chapters = await storage.getSessionChapters(req.params.sessionId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.patch('/api/chapters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const session = await storage.getGameSession(chapter.sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedChapter = await storage.updateChapter(req.params.id, req.body);
      res.json(updatedChapter);
    } catch (error) {
      console.error("Error updating chapter:", error);
      res.status(500).json({ message: "Failed to update chapter" });
    }
  });

  app.delete('/api/chapters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const session = await storage.getGameSession(chapter.sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteChapter(req.params.id);
      res.json({ message: "Chapter deleted successfully" });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  // Chapter Events Routes
  app.post('/api/chapter-events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const eventData = {
        ...req.body,
        userId,
      };
      const event = await storage.createChapterEvent(eventData);
      
      // Broadcast event to WebSocket clients
      if (eventData.sessionId) {
        broadcastToSession(eventData.sessionId, {
          type: 'chapter_event',
          data: event as any
        });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error creating chapter event:", error);
      res.status(500).json({ message: "Failed to create chapter event" });
    }
  });

  app.get('/api/chapters/:chapterId/events', async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const events = await storage.getChapterEvents(req.params.chapterId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching chapter events:", error);
      res.status(500).json({ message: "Failed to fetch chapter events" });
    }
  });

  app.get('/api/sessions/:sessionId/important-events', async (req: any, res) => {
    try {
      const events = await storage.getImportantChapterEvents(req.params.sessionId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching important events:", error);
      res.status(500).json({ message: "Failed to fetch important events" });
    }
  });

  app.patch('/api/chapter-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.updateChapterEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error("Error updating chapter event:", error);
      res.status(500).json({ message: "Failed to update chapter event" });
    }
  });

  app.delete('/api/chapter-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteChapterEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chapter event:", error);
      res.status(500).json({ message: "Failed to delete chapter event" });
    }
  });

  // Character routes
  app.post('/api/characters', async (req: any, res) => {
    try {
      // For players without auth, userId can be null
      const userId = req.user ? getUserId(req) : null;
      let { sessionId } = req.body;
      
      // Handle temporary session IDs or create a default session
      if (!sessionId || sessionId === "none" || sessionId.startsWith("temp-")) {
        // If user is authenticated, check for their sessions
        if (userId) {
          const defaultSessions = await storage.getGameSessionsByGM(userId);
          
          if (defaultSessions.length === 0) {
            // Create a default session for this user
            const defaultSession = await storage.createGameSession({
              name: "Session par défaut",
              gmId: userId,
              code: null,
              status: "preparation"
            });
            sessionId = defaultSession.id;
          } else {
            sessionId = defaultSessions[0].id;
          }
        } else {
          // For unauthenticated users, use or create a public session
          const publicSessions = await storage.getGameSessionsByGM(userId || "21448396"); // Use current user or test user ID
          
          if (publicSessions.length === 0) {
            // Cannot create session without valid GM ID
            return res.status(400).json({ 
              message: "Veuillez vous connecter ou sélectionner une session existante pour créer un personnage." 
            });
          }
          sessionId = publicSessions[0].id;
        }
      }
      
      const characterData = insertCharacterSchema.parse({
        ...req.body,
        sessionId,
        userId,
        skillsLocked: true // Lock skills immediately after creation
      });
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(400).json({ message: "Failed to create character" });
    }
  });

  app.get('/api/characters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const characters = await storage.getCharactersByUser(userId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.get('/api/characters/:id', async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const [sanityConditions, activeEffects] = await Promise.all([
        storage.getCharacterSanityConditions(character.id),
        storage.getCharacterActiveEffects(character.id)
      ]);
      
      res.json({ ...character, sanityConditions, activeEffects });
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  app.patch('/api/characters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const updateData = req.body;
      
      // Get the character to check if skills are locked
      const existingCharacter = await storage.getCharacter(req.params.id);
      if (!existingCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check if the user is the GM of the session
      const session = await storage.getGameSession(existingCharacter.sessionId);
      const isGM = session && session.gmId === userId;
      
      // If skills are locked and user is not GM, prevent skill modification
      if (existingCharacter.skillsLocked && !isGM && updateData.skills !== undefined) {
        delete updateData.skills; // Remove skills from update data
        // You could also return an error here instead:
        // return res.status(403).json({ message: "Skills are locked and cannot be modified" });
      }
      
      // GM can unlock skills when editing
      if (isGM && updateData.skills !== undefined) {
        updateData.skillsLocked = false;
      }
      const character = await storage.updateCharacter(req.params.id, updateData);
      
      // Apply automatic status effects if HP or Sanity changed
      if (updateData.hitPoints !== undefined || updateData.sanity !== undefined) {
        await applyAutomaticStatusEffects({
          characterId: character.id,
          currentHp: character.hitPoints,
          maxHp: character.maxHitPoints,
          currentSanity: character.sanity,
          maxSanity: character.maxSanity,
          strength: character.strength,
          constitution: character.constitution,
          size: character.size
        });
      }
      
      // Fetch updated effects
      const [sanityConditions, activeEffects] = await Promise.all([
        storage.getCharacterSanityConditions(character.id),
        storage.getCharacterActiveEffects(character.id)
      ]);
      
      res.json({ ...character, sanityConditions, activeEffects });
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(400).json({ message: "Failed to update character" });
    }
  });

  // Update character notes
  app.patch('/api/characters/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { notes } = req.body;
      const characterId = req.params.id;
      
      // Get the character to check ownership
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check if the user owns the character or is the GM
      const session = await storage.getGameSession(character.sessionId);
      const isGM = session && session.gmId === userId;
      const isOwner = character.userId === userId;
      
      if (!isOwner && !isGM) {
        return res.status(403).json({ message: "You don't have permission to edit these notes" });
      }
      
      // Update only the notes field
      const updatedCharacter = await storage.updateCharacter(characterId, { notes });
      
      res.json({ notes: updatedCharacter.notes });
    } catch (error) {
      console.error("Error updating character notes:", error);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  // Get character inventory
  app.get('/api/characters/:id/inventory', async (req, res) => {
    try {
      const items = await storage.getCharacterInventory(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });
  
  // Add item to inventory
  app.post('/api/characters/:id/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const characterId = req.params.id;
      
      // Check if user is GM or owns the character
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const session = await storage.getGameSession(character.sessionId);
      const isGM = session && session.gmId === userId;
      const isOwner = character.userId === userId;
      
      if (!isOwner && !isGM) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const item = await storage.addInventoryItem({
        ...req.body,
        characterId
      });
      
      res.json(item);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(500).json({ message: "Failed to add item" });
    }
  });
  
  // Update inventory item
  app.patch('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const itemId = req.params.id;
      
      // Get item to check ownership
      const [item] = await storage.getCharacterInventory(itemId);
      if (item) {
        const character = await storage.getCharacter(item.characterId);
        if (character) {
          const session = await storage.getGameSession(character.sessionId);
          const isGM = session && session.gmId === userId;
          const isOwner = character.userId === userId;
          
          if (!isOwner && !isGM) {
            return res.status(403).json({ message: "Permission denied" });
          }
        }
      }
      
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  
  // Toggle item equipped status
  app.patch('/api/inventory/:id/equip', isAuthenticated, async (req: any, res) => {
    try {
      const { isEquipped } = req.body;
      const item = await storage.equipItem(req.params.id, isEquipped);
      res.json(item);
    } catch (error) {
      console.error("Error toggling item equipped status:", error);
      res.status(500).json({ message: "Failed to toggle equipped status" });
    }
  });
  
  // Delete inventory item
  app.delete('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteInventoryItem(req.params.id);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Update inventory item quantity from character path (for GM)
  app.patch('/api/characters/:characterId/inventory/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { characterId, itemId } = req.params;
      const { quantity } = req.body;
      
      // Check if user is GM
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const session = await storage.getGameSession(character.sessionId);
      const isGM = session && session.gmId === userId;
      const isOwner = character.userId === userId;
      
      if (!isOwner && !isGM) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const updatedItem = await storage.updateInventoryItem(itemId, { quantity });
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory quantity:", error);
      res.status(500).json({ message: "Failed to update quantity" });
    }
  });
  
  // Delete inventory item from character path (for GM)
  app.delete('/api/characters/:characterId/inventory/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { characterId, itemId } = req.params;
      
      // Check if user is GM
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const session = await storage.getGameSession(character.sessionId);
      const isGM = session && session.gmId === userId;
      const isOwner = character.userId === userId;
      
      if (!isOwner && !isGM) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      await storage.deleteInventoryItem(itemId);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Narrative entries routes
  
  // Get narrative entries for a session
  app.get('/api/sessions/:sessionId/narrative', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionId } = req.params;
      
      // Check if user is GM of the session
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can access narrative entries" });
      }
      
      const entries = await storage.getSessionNarrativeEntries(sessionId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching narrative entries:", error);
      res.status(500).json({ message: "Failed to fetch narrative entries" });
    }
  });
  
  // Create new narrative entry
  app.post('/api/sessions/:sessionId/narrative', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionId } = req.params;
      const { content, entryType } = req.body;
      
      // Check if user is GM of the session
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can create narrative entries" });
      }
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const entry = await storage.createNarrativeEntry({
        sessionId,
        gmId: userId,
        content: content.trim(),
        entryType: entryType || 'note',
        isAiGenerated: false,
      });
      
      res.json(entry);
    } catch (error) {
      console.error("Error creating narrative entry:", error);
      res.status(500).json({ message: "Failed to create narrative entry" });
    }
  });
  
  // Get AI narrative suggestion
  app.post('/api/sessions/:sessionId/narrative/ai-suggest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionId } = req.params;
      const { context } = req.body;
      
      // Check if user is GM of the session
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can request AI suggestions" });
      }
      
      const suggestion = await generateNarrativeSuggestion(context || "");
      res.json({ suggestion });
    } catch (error) {
      console.error("Error generating AI suggestion:", error);
      res.status(500).json({ message: "Failed to generate AI suggestion" });
    }
  });
  
  // Update narrative entry
  app.patch('/api/narrative/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { content, entryType, metadata, isAiGenerated } = req.body;
      
      // Validate input
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Validate entry type
      const validTypes = ['note', 'event', 'npc', 'location', 'clue'];
      if (entryType && !validTypes.includes(entryType)) {
        return res.status(400).json({ message: "Invalid entry type" });
      }
      
      // Get the existing entry to check permissions
      const existingEntry = await storage.getNarrativeEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Narrative entry not found" });
      }
      
      // Verify user is the GM who created this entry
      if (existingEntry.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM who created this entry can edit it" });
      }
      
      // Only allow updating specific fields - NEVER gmId or sessionId
      const updateData: Partial<typeof existingEntry> = {
        content: content.trim(),
      };
      
      if (entryType !== undefined) {
        updateData.entryType = entryType;
      }
      
      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }
      
      if (isAiGenerated !== undefined) {
        updateData.isAiGenerated = isAiGenerated;
      }
      
      const entry = await storage.updateNarrativeEntry(id, updateData);
      
      res.json(entry);
    } catch (error) {
      console.error("Error updating narrative entry:", error);
      res.status(500).json({ message: "Failed to update narrative entry" });
    }
  });
  
  // Delete narrative entry
  app.delete('/api/narrative/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      // Get the existing entry to check permissions
      const existingEntry = await storage.getNarrativeEntry(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Narrative entry not found" });
      }
      
      // Verify user is the GM who created this entry
      if (existingEntry.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM who created this entry can delete it" });
      }
      
      await storage.deleteNarrativeEntry(id);
      res.json({ message: "Narrative entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting narrative entry:", error);
      res.status(500).json({ message: "Failed to delete narrative entry" });
    }
  });

  // GameBoard scene generation endpoint
  app.post('/api/gameboard/generate-scene', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { prompt, sessionId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Verify GM access to session
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const { url } = await generateSceneImage(prompt);
      res.json({ imageUrl: url });
    } catch (error) {
      console.error("Error generating scene:", error);
      res.status(500).json({ message: "Failed to generate scene" });
    }
  });

  // Simple avatar generation without character ID requirement
  app.post('/api/generate-avatar', isAuthenticated, async (req, res) => {
    try {
      const { description, characterName, occupation, age } = req.body;
      
      if (!description || !characterName) {
        return res.status(400).json({ message: "Description and character name are required" });
      }

      // Generate without character ID for preview
      const { url } = await generateCharacterAvatar(description, characterName, occupation, age);

      res.json({ avatarUrl: url });
    } catch (error) {
      console.error("Error generating avatar:", error);
      res.status(500).json({ message: "Failed to generate avatar" });
    }
  });

  // Generate avatar for a single character (Player or GM)
  app.post('/api/characters/:characterId/generate-avatar', async (req: any, res) => {
    try {
      const characterId = req.params.characterId;
      
      // Get character data
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Build description based on character data
      let description = "";
      
      // Add gender if available
      if (character.gender) {
        description += `${character.gender}, `;
      }
      
      // Add physical characteristics if we have them
      if (character.appearance && character.appearance >= 60) {
        description += "attractive appearance, ";
      } else if (character.appearance && character.appearance <= 30) {
        description += "weathered appearance, ";
      }
      
      // Add intelligence/education hints
      if (character.education && character.education >= 80) {
        description += "scholarly and intellectual demeanor, ";
      } else if (character.intelligence && character.intelligence >= 70) {
        description += "intelligent and sharp gaze, ";
      }
      
      // Add strength/constitution hints
      if (character.strength && character.strength >= 70) {
        description += "strong and robust build, ";
      } else if (character.constitution && character.constitution >= 70) {
        description += "healthy and vigorous appearance, ";
      }
      
      // Default to a mysterious investigator look if no specific traits
      if (description === "") {
        description = "mysterious investigator with a determined expression, ";
      }
      
      description += "dramatic shadows, vintage 1920s style";
      
      const { url } = await generateCharacterAvatar(
        description, 
        character.name, 
        character.occupation || undefined, 
        character.age || undefined,
        character.id
      );
      
      // Update character with avatar URL
      await storage.updateCharacter(character.id, {
        avatarUrl: url,
        avatarPrompt: description
      });
      
      res.json({
        message: "Avatar generated successfully",
        avatarUrl: url,
        characterId: character.id,
        characterName: character.name
      });
      
    } catch (error) {
      console.error("Error generating avatar:", error);
      res.status(500).json({ message: "Failed to generate avatar" });
    }
  });

  // Generate avatars for all characters in a session (GM only)
  app.post('/api/sessions/:sessionId/generate-all-avatars', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      const userId = getUserId(req);
      const { forceRegenerate = false } = req.body;
      
      // Check if user is GM
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can generate avatars for all characters" });
      }
      
      // Get all characters in the session
      const characters = await storage.getCharactersBySession(sessionId);
      
      // Filter characters based on forceRegenerate option
      const charactersToGenerate = forceRegenerate 
        ? characters 
        : characters.filter((c: any) => !c.avatarUrl);
      
      if (charactersToGenerate.length === 0) {
        return res.json({ 
          message: "All characters already have avatars", 
          generated: 0 
        });
      }
      
      const results = [];
      const errors = [];
      
      for (const character of charactersToGenerate) {
        try {
          // Build description based on character data
          let description = "";
          
          // Add gender if available
          if (character.gender) {
            description += `${character.gender}, `;
          }
          
          // Add physical characteristics if we have them
          if (character.appearance && character.appearance >= 60) {
            description += "attractive appearance, ";
          } else if (character.appearance && character.appearance <= 30) {
            description += "weathered appearance, ";
          }
          
          // Add intelligence/education hints
          if (character.education && character.education >= 80) {
            description += "scholarly and intellectual demeanor, ";
          } else if (character.intelligence && character.intelligence >= 70) {
            description += "intelligent and sharp gaze, ";
          }
          
          // Add strength/constitution hints
          if (character.strength && character.strength >= 70) {
            description += "strong and robust build, ";
          } else if (character.constitution && character.constitution >= 70) {
            description += "healthy and vigorous appearance, ";
          }
          
          // Default to a mysterious investigator look if no specific traits
          if (description === "") {
            description = "mysterious investigator with a determined expression, ";
          }
          
          description += "dramatic shadows, vintage 1920s style";
          
          const { url } = await generateCharacterAvatar(
            description, 
            character.name, 
            character.occupation || undefined, 
            character.age || undefined,
            character.id
          );
          
          // Update character with avatar URL
          await storage.updateCharacter(character.id, {
            avatarUrl: url,
            avatarPrompt: description
          });
          
          results.push({
            characterId: character.id,
            characterName: character.name,
            avatarUrl: url
          });
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to generate avatar for ${character.name}:`, error);
          errors.push({
            characterId: character.id,
            characterName: character.name,
            error: "Failed to generate avatar"
          });
        }
      }
      
      res.json({
        message: `Generated ${results.length} avatars`,
        generated: results.length,
        failed: errors.length,
        results,
        errors
      });
      
    } catch (error) {
      console.error("Error generating avatars:", error);
      res.status(500).json({ message: "Failed to generate avatars" });
    }
  });

  // Migrate existing avatars from external URLs to local storage
  app.post('/api/migrate-avatars', isAuthenticated, async (req: any, res) => {
    try {
      // Optional: You might want to restrict this to admin users
      // For now, we'll allow any authenticated user to trigger migration
      
      console.log(`Avatar migration triggered by user ${req.user.claims.sub}`);
      
      const result = await migrateExistingAvatars();
      
      res.json({
        message: "Avatar migration completed",
        ...result
      });
    } catch (error) {
      console.error("Error during avatar migration:", error);
      res.status(500).json({ message: "Failed to migrate avatars" });
    }
  });

  // Sanity condition routes
  app.post('/api/characters/:id/sanity-conditions', isAuthenticated, async (req, res) => {
    try {
      const conditionData = insertSanityConditionSchema.parse({
        ...req.body,
        characterId: req.params.id
      });
      
      let description = req.body.description;
      if (!description && req.body.type === 'phobia') {
        description = await generatePhobiaDescription(req.body.name);
      } else if (!description && req.body.type === 'mania') {
        description = await generateManiaDescription(req.body.name);
      }
      
      const condition = await storage.addSanityCondition({
        ...conditionData,
        description
      });
      res.json(condition);
    } catch (error) {
      console.error("Error adding sanity condition:", error);
      res.status(400).json({ message: "Failed to add sanity condition" });
    }
  });

  // Delete character from session (GM only)
  app.delete('/api/sessions/:sessionId/characters/:characterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Check if GM owns this session
      const session = await storage.getGameSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can remove players from the session" });
      }
      
      // Check if character exists and belongs to this session
      const character = await storage.getCharacter(req.params.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      if (character.sessionId !== req.params.sessionId) {
        return res.status(400).json({ message: "Character does not belong to this session" });
      }
      
      // Delete the character
      await storage.deleteCharacter(req.params.characterId);
      
      res.json({ message: "Character removed from session successfully" });
    } catch (error) {
      console.error("Error removing character from session:", error);
      res.status(500).json({ message: "Failed to remove character from session" });
    }
  });

  // Get importable characters (characters from GM's other sessions)
  app.get('/api/sessions/:sessionId/importable-characters', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      const userId = getUserId(req);
      
      // Check if user is GM of this session
      const session = await storage.getGameSession(sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can import characters" });
      }
      
      // Get all sessions owned by this GM
      const gmSessions = await storage.getGameSessionsByGM(userId);
      
      // Get all characters from GM's other sessions
      const charactersPromises = gmSessions
        .filter(s => s.id !== sessionId)
        .map(s => storage.getCharactersBySession(s.id));
      
      const charactersArrays = await Promise.all(charactersPromises);
      const allCharacters = charactersArrays.flat();
      
      // Include session name with each character for context
      const charactersWithSessionInfo = allCharacters.map(char => {
        const charSession = gmSessions.find(s => s.id === char.sessionId);
        return {
          ...char,
          sessionName: charSession?.name || 'Unknown Session'
        };
      });
      
      res.json(charactersWithSessionInfo);
    } catch (error) {
      console.error("Error fetching importable characters:", error);
      res.status(500).json({ message: "Failed to fetch importable characters" });
    }
  });

  // Import character into session (creates a copy)
  app.post('/api/sessions/:sessionId/import-character', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      const { characterId, resetState = true } = req.body;
      const userId = getUserId(req);
      
      if (!characterId) {
        return res.status(400).json({ message: "Character ID is required" });
      }
      
      // Check if user is GM of target session
      const targetSession = await storage.getGameSession(sessionId);
      if (!targetSession || targetSession.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can import characters" });
      }
      
      // Get source character
      const sourceCharacter = await storage.getCharacter(characterId);
      if (!sourceCharacter) {
        return res.status(404).json({ message: "Source character not found" });
      }
      
      // Verify source session belongs to same GM
      const sourceSession = await storage.getGameSession(sourceCharacter.sessionId);
      if (!sourceSession || sourceSession.gmId !== userId) {
        return res.status(403).json({ message: "You can only import characters from your own sessions" });
      }
      
      // Create copy of character in new session (without avatar first)
      const importedCharacter = await storage.createCharacter({
        name: sourceCharacter.name,
        occupation: sourceCharacter.occupation,
        age: sourceCharacter.age || undefined,
        birthplace: sourceCharacter.birthplace || undefined,
        residence: sourceCharacter.residence || undefined,
        gender: sourceCharacter.gender || undefined,
        
        // Copy physical characteristics
        height: sourceCharacter.height || undefined,
        build: sourceCharacter.build || undefined,
        hairColor: sourceCharacter.hairColor || undefined,
        eyeColor: sourceCharacter.eyeColor || undefined,
        
        sessionId: sessionId,
        userId: sourceCharacter.userId || undefined,
        
        // Copy all characteristics
        strength: sourceCharacter.strength,
        constitution: sourceCharacter.constitution,
        size: sourceCharacter.size,
        dexterity: sourceCharacter.dexterity,
        appearance: sourceCharacter.appearance,
        intelligence: sourceCharacter.intelligence,
        power: sourceCharacter.power,
        education: sourceCharacter.education,
        luck: sourceCharacter.luck,
        
        // Apply state based on resetState parameter
        hitPoints: resetState ? sourceCharacter.maxHitPoints : sourceCharacter.hitPoints,
        maxHitPoints: sourceCharacter.maxHitPoints,
        sanity: resetState ? sourceCharacter.maxSanity : sourceCharacter.sanity,
        maxSanity: sourceCharacter.maxSanity,
        magicPoints: resetState ? sourceCharacter.maxMagicPoints : sourceCharacter.magicPoints,
        maxMagicPoints: sourceCharacter.maxMagicPoints,
        
        // Avatar will be set after copying the file
        avatarPrompt: sourceCharacter.avatarPrompt || undefined,
        
        // Copy skills
        skills: sourceCharacter.skills,
        skillsLocked: sourceCharacter.skillsLocked || false,
        availableSkillPoints: resetState ? 0 : (sourceCharacter.availableSkillPoints || 0),
        
        // Handle progress-related fields based on resetState
        notes: resetState ? undefined : sourceCharacter.notes,
        money: resetState ? '0.00' : sourceCharacter.money
      });
      
      // Handle avatar copying - ensure the avatar file exists and copy it
      if (sourceCharacter.avatarUrl) {
        let newAvatarUrl: string | null = null;
        
        // Try to copy the existing avatar file
        if (avatarFileExists(sourceCharacter.avatarUrl)) {
          newAvatarUrl = copyAvatar(sourceCharacter.avatarUrl, importedCharacter.id);
          console.log(`Avatar copied successfully for character ${importedCharacter.name}`);
        } else {
          console.log(`Source avatar file not found for ${sourceCharacter.name}, will regenerate if needed`);
          // If avatar doesn't exist but we have a prompt, we could regenerate
          // For now, we'll leave it null and let the frontend handle the placeholder
        }
        
        // Update character with new avatar URL
        if (newAvatarUrl) {
          await storage.updateCharacter(importedCharacter.id, { avatarUrl: newAvatarUrl });
        }
      }
      
      // If not resetting state, also copy sanity conditions and active effects
      if (!resetState) {
        // Copy sanity conditions
        const sanityConditions = await storage.getCharacterSanityConditions(characterId);
        for (const condition of sanityConditions) {
          await storage.addSanityCondition({
            characterId: importedCharacter.id,
            type: condition.type,
            name: condition.name,
            description: condition.description || undefined,
            duration: condition.duration || undefined,
            isActive: condition.isActive
          });
        }
        
        // Copy active effects
        const activeEffects = await storage.getCharacterActiveEffects(characterId);
        for (const effect of activeEffects) {
          await storage.addActiveEffect({
            characterId: importedCharacter.id,
            appliedBy: effect.appliedBy || undefined,
            type: effect.type,
            name: effect.name,
            description: effect.description || undefined,
            value: effect.value || undefined,
            duration: effect.duration || undefined,
            isActive: effect.isActive
          });
        }
        
        // Copy inventory items
        const inventoryItems = await storage.getCharacterInventory(characterId);
        for (const item of inventoryItems) {
          await storage.addInventoryItem({
            characterId: importedCharacter.id,
            name: item.name,
            quantity: item.quantity,
            description: item.description || undefined
          });
        }
      }
      
      res.json({
        message: "Character imported successfully",
        character: importedCharacter,
        resetState
      });
    } catch (error) {
      console.error("Error importing character:", error);
      res.status(500).json({ message: "Failed to import character" });
    }
  });

  // Grant skill points to character (GM only)
  app.post('/api/characters/:id/skill-points', isAuthenticated, async (req: any, res) => {
    const characterId = req.params.id;
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: "Invalid points value" });
    }
    
    try {
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check if user is GM of the session
      const userId = getUserId(req);
      const session = await storage.getGameSession(character.sessionId);
      if (!session || session.gmId !== userId) {
        return res.status(403).json({ message: "Only the GM can grant skill points" });
      }
      
      // Update available skill points
      const currentPoints = character.availableSkillPoints || 0;
      const updatedCharacter = await storage.updateCharacter(characterId, {
        availableSkillPoints: currentPoints + points
      });
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error granting skill points:", error);
      res.status(500).json({ message: "Failed to grant skill points" });
    }
  });
  
  // Distribute skill points (player action)
  app.post('/api/characters/:id/distribute-points', isAuthenticated, async (req: any, res) => {
    const characterId = req.params.id;
    const { skillUpdates } = req.body;
    
    if (!skillUpdates || typeof skillUpdates !== 'object') {
      return res.status(400).json({ message: "Invalid skill updates" });
    }
    
    try {
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check if user owns the character or is GM
      const userId = getUserId(req);
      const session = await storage.getGameSession(character.sessionId);
      if (character.userId !== userId && session?.gmId !== userId) {
        return res.status(403).json({ message: "Unauthorized to modify this character" });
      }
      
      // Calculate total points to be used
      const currentSkills = character.skills as Record<string, number> || {};
      let totalPointsUsed = 0;
      const updatedSkills = { ...currentSkills };
      
      Object.entries(skillUpdates).forEach(([skillName, newValue]) => {
        const currentValue = currentSkills[skillName] || 0;
        const newValueNum = newValue as number;
        const pointsAdded = newValueNum - currentValue;
        if (pointsAdded > 0) {
          totalPointsUsed += pointsAdded;
          updatedSkills[skillName] = newValueNum;
        }
      });
      
      // Check if character has enough points
      const availablePoints = character.availableSkillPoints || 0;
      if (totalPointsUsed > availablePoints) {
        return res.status(400).json({ message: "Not enough skill points available" });
      }
      
      // Update character skills and available points
      const updatedCharacter = await storage.updateCharacter(characterId, {
        skills: updatedSkills,
        availableSkillPoints: availablePoints - totalPointsUsed
      });
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error distributing skill points:", error);
      res.status(500).json({ message: "Failed to distribute skill points" });
    }
  });

  // Active effect routes
  app.post('/api/characters/:id/effects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const effectData = insertActiveEffectSchema.parse({
        ...req.body,
        characterId: req.params.id,
        appliedBy: userId
      });
      const effect = await storage.addActiveEffect(effectData);
      
      // Update character stats based on effect type
      const character = await storage.getCharacter(req.params.id);
      if (character) {
        const value = parseInt(effectData.value || '0');
        let updateData: any = {};
        let shouldApplyAutoEffects = false;
        
        if (effectData.type === 'damage' && value !== 0) {
          // Apply damage to HP
          updateData.hitPoints = Math.max(0, character.hitPoints - Math.abs(value));
          shouldApplyAutoEffects = true;
        } else if (effectData.type === 'sanity_loss' && value !== 0) {
          // Apply sanity loss
          updateData.sanity = Math.max(0, character.sanity - Math.abs(value));
          shouldApplyAutoEffects = true;
          
          // Check if temporary insanity should be applied
          if (Math.abs(value) >= 5) {
            await applyTemporaryInsanity(character.id);
          }
        } else if (effectData.type === 'buff') {
          // Handle buffs using dedicated functions
          const buffValue = Math.abs(value);
          const duration = effectData.duration || 0;
          
          // Determine buff type from name or metadata
          if (effectData.name?.toLowerCase().includes('soin') || 
              effectData.name?.toLowerCase().includes('heal') ||
              effectData.name?.toLowerCase().includes('premiers soins') ||
              effectData.name?.toLowerCase().includes('traitement') ||
              effectData.name?.toLowerCase().includes('chirurgie') ||
              effectData.name?.toLowerCase().includes('pv') ||
              effectData.name?.toLowerCase().includes('vie')) {
            // Use dedicated healing function
            const result = await applyHealing(character, buffValue, effectData.name);
            console.log(`Applied healing: +${result.amountHealed} HP to ${character.name}`);
            shouldApplyAutoEffects = true;
            // No need to update character here, applyHealing does it
            updateData = {}; 
          } else if (effectData.name?.toLowerCase().includes('sanité') || 
                     effectData.name?.toLowerCase().includes('sanity') ||
                     effectData.name?.toLowerCase().includes('thérapie') ||
                     effectData.name?.toLowerCase().includes('réconfort') ||
                     effectData.name?.toLowerCase().includes('psychanalyse')) {
            // Use dedicated sanity recovery function
            const result = await applySanityRecovery(character, buffValue, effectData.name);
            console.log(`Applied sanity recovery: +${result.amountRecovered} SAN to ${character.name}`);
            shouldApplyAutoEffects = true;
            updateData = {};
          } else if (effectData.name?.toLowerCase().includes('magie') || 
                     effectData.name?.toLowerCase().includes('magic') ||
                     effectData.name?.toLowerCase().includes('méditation') ||
                     effectData.name?.toLowerCase().includes('repos rituel')) {
            // Use dedicated magic recovery function
            const result = await applyMagicRecovery(character, buffValue, effectData.name);
            console.log(`Applied magic recovery: +${result.amountRecovered} MP to ${character.name}`);
            updateData = {};
          } else if (effectData.name?.toLowerCase().includes('chance') || 
                     effectData.name?.toLowerCase().includes('luck') ||
                     effectData.name?.toLowerCase().includes('bénédiction')) {
            // Use dedicated luck boost function
            const result = await applyLuckBoost(character, buffValue, duration, effectData.name);
            console.log(`Applied luck boost: +${result.amountIncreased} Luck to ${character.name}`);
            updateData = {};
          } else if (effectData.name?.toLowerCase().includes('compétence') || 
                     effectData.name?.toLowerCase().includes('skill') ||
                     effectData.name?.toLowerCase().includes('inspiration') ||
                     effectData.name?.toLowerCase().includes('bonus')) {
            // Use dedicated skill bonus function
            await applySkillBonus(character, buffValue, duration, effectData.name);
            console.log(`Applied skill bonus: +${buffValue}% to ${character.name}`);
            updateData = {};
          } else {
            // Generic buff - just record the effect
            const addedEffect = await storage.addActiveEffect(effectData);
            console.log(`Applied generic buff: ${effectData.name} to ${character.name}`);
            res.json(addedEffect);
            return;
          }
        }
        
        // Update character if there are changes
        if (Object.keys(updateData).length > 0) {
          await storage.updateCharacter(req.params.id, updateData);
        }
        
        // Apply automatic status effects if HP or Sanity changed
        if (shouldApplyAutoEffects) {
          const updatedChar = { ...character, ...updateData };
          await applyAutomaticStatusEffects({
            characterId: character.id,
            currentHp: updatedChar.hitPoints,
            maxHp: updatedChar.maxHitPoints,
            currentSanity: updatedChar.sanity,
            maxSanity: updatedChar.maxSanity,
            strength: updatedChar.strength,
            constitution: updatedChar.constitution,
            size: updatedChar.size
          });
        }
      }
      
      res.json(effect);
    } catch (error) {
      console.error("Error adding effect:", error);
      res.status(400).json({ message: "Failed to add effect" });
    }
  });

  app.patch('/api/effects/:id', isAuthenticated, async (req, res) => {
    try {
      const updateData = req.body;
      const effect = await storage.updateActiveEffect(req.params.id, updateData);
      res.json(effect);
    } catch (error) {
      console.error("Error updating effect:", error);
      res.status(400).json({ message: "Failed to update effect" });
    }
  });

  // Dice roll routes
  app.post('/api/rolls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const rollData = insertRollHistorySchema.parse({
        ...req.body,
        userId: userId
      });
      const roll = await storage.addRollHistory(rollData);
      
      // Broadcast roll to WebSocket clients in the same session
      if (rollData.sessionId) {
        broadcastToSession(rollData.sessionId, {
          type: 'roll_result',
          data: roll
        });
      }
      
      res.json(roll);
    } catch (error) {
      console.error("Error recording roll:", error);
      res.status(400).json({ message: "Failed to record roll" });
    }
  });

  app.get('/api/sessions/:id/rolls', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const rolls = await storage.getSessionRollHistory(req.params.id, limit);
      res.json(rolls);
    } catch (error) {
      console.error("Error fetching session rolls:", error);
      res.status(500).json({ message: "Failed to fetch session rolls" });
    }
  });

}
