import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateCharacterAvatar, generatePhobiaDescription, generateManiaDescription } from "./openai";
import {
  insertGameSessionSchema,
  insertCharacterSchema,
  insertSanityConditionSchema,
  insertActiveEffectSchema,
  insertRollHistorySchema,
  insertChapterSchema,
} from "@shared/schema";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Game session routes
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const sessionData = insertGameSessionSchema.parse({
        ...req.body,
        gmId: req.user.claims.sub,
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
      const sessions = await storage.getGameSessionsByGM(req.user.claims.sub);
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
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== req.user.claims.sub) {
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
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== req.user.claims.sub) {
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
      const session = await storage.getGameSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.gmId !== req.user.claims.sub) {
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
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const session = await storage.getGameSession(chapter.sessionId);
      if (!session || session.gmId !== req.user.claims.sub) {
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
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const session = await storage.getGameSession(chapter.sessionId);
      if (!session || session.gmId !== req.user.claims.sub) {
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
      const userId = req.user.claims.sub;
      const eventData = {
        ...req.body,
        userId,
      };
      const event = await storage.createChapterEvent(eventData);
      
      // Broadcast event to WebSocket clients
      if (eventData.sessionId) {
        broadcastToSession(eventData.sessionId, {
          type: 'chapter_event',
          data: event
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
      const userId = req.user?.claims?.sub || null;
      const characterData = insertCharacterSchema.parse({
        ...req.body,
        userId
      });
      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(400).json({ message: "Failed to create character" });
    }
  });

  app.get('/api/characters', async (req: any, res) => {
    try {
      const characters = await storage.getCharactersByUser(req.user.claims.sub);
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

  app.patch('/api/characters/:id', isAuthenticated, async (req, res) => {
    try {
      const updateData = req.body;
      const character = await storage.updateCharacter(req.params.id, updateData);
      res.json(character);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(400).json({ message: "Failed to update character" });
    }
  });

  // Avatar generation
  app.post('/api/characters/:id/generate-avatar', isAuthenticated, async (req, res) => {
    try {
      const { description, characterName } = req.body;
      
      if (!description || !characterName) {
        return res.status(400).json({ message: "Description and character name are required" });
      }

      const { url } = await generateCharacterAvatar(description, characterName);
      
      // Update character with avatar URL
      await storage.updateCharacter(req.params.id, {
        avatarUrl: url,
        avatarPrompt: description
      });

      res.json({ avatarUrl: url });
    } catch (error) {
      console.error("Error generating avatar:", error);
      res.status(500).json({ message: "Failed to generate avatar" });
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

  // Active effect routes
  app.post('/api/characters/:id/effects', isAuthenticated, async (req: any, res) => {
    try {
      const effectData = insertActiveEffectSchema.parse({
        ...req.body,
        characterId: req.params.id,
        appliedBy: req.user.claims.sub
      });
      const effect = await storage.addActiveEffect(effectData);
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
      const rollData = insertRollHistorySchema.parse({
        ...req.body,
        userId: req.user.claims.sub
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

  // WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections by session
  const sessionConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let sessionId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_session' && data.sessionId) {
          sessionId = data.sessionId;
          
          if (!sessionConnections.has(sessionId)) {
            sessionConnections.set(sessionId, new Set());
          }
          sessionConnections.get(sessionId)?.add(ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (sessionId && sessionConnections.has(sessionId)) {
        sessionConnections.get(sessionId)?.delete(ws);
        if (sessionConnections.get(sessionId)?.size === 0) {
          sessionConnections.delete(sessionId);
        }
      }
    });
  });

  function broadcastToSession(sessionId: string, message: any) {
    const connections = sessionConnections.get(sessionId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  return httpServer;
}
