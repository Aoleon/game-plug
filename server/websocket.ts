import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Request } from "express";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

// Define specific data types for different message types
interface JoinSessionData {
  sessionId: string;
  userId: string;
}

interface RollData {
  rollType: string;
  result: number;
  skillName?: string;
  characterId?: string;
  success?: string;
  diceFormula: string;
}

interface EffectData {
  characterId: string;
  effectType: string;
  value: string | number;
  duration?: number;
}

interface ProjectionData {
  imageUrl?: string;
  description?: string;
  isActive: boolean;
}

interface NarrationData {
  text: string;
  isPublic: boolean;
}

interface AmbianceData {
  type: string;
  isActive: boolean;
}

// Base message interface with typed data
interface WSMessage {
  type: string;
  data?: JoinSessionData | RollData | EffectData | ProjectionData | NarrationData | AmbianceData | { userId?: string } | string;
  timestamp?: Date;
}

const clients = new Map<string, Set<ExtendedWebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/game-ws',
    verifyClient: (info, cb) => {
      // Basic verification - in production you'd want to verify auth tokens
      cb(true);
    }
  });

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (ws: ExtendedWebSocket, req: Request) => {
    console.log('New WebSocket connection established');
    
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(ws, message, wss);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          data: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Remove from session clients
      if (ws.sessionId) {
        const sessionClients = clients.get(ws.sessionId);
        if (sessionClients) {
          sessionClients.delete(ws);
          if (sessionClients.size === 0) {
            clients.delete(ws.sessionId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      data: 'Connected to Call of Cthulhu game server',
      timestamp: new Date()
    }));
  });

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

function handleMessage(ws: ExtendedWebSocket, message: WSMessage, wss: WebSocketServer) {
  switch (message.type) {
    case 'join_session':
      if (message.data && typeof message.data === 'object' && 'sessionId' in message.data) {
        handleJoinSession(ws, message.data as JoinSessionData);
      }
      break;
      
    case 'leave_session':
      handleLeaveSession(ws);
      break;
      
    case 'gm_roll':
      broadcastToSession(ws.sessionId, {
        type: 'gm_roll',
        data: message.data,
        timestamp: new Date()
      }, ws);
      break;
      
    case 'player_roll':
      if (message.data && typeof message.data === 'object') {
        broadcastToSession(ws.sessionId, {
          type: 'player_roll',
          data: {
            ...(message.data as RollData),
            userId: ws.userId
          },
          timestamp: new Date()
        });
      }
      break;
      
    case 'ambiance':
      broadcastToSession(ws.sessionId, {
        type: 'ambiance',
        data: message.data,
        timestamp: new Date()
      }, ws);
      break;
      
    case 'narration':
      broadcastToSession(ws.sessionId, {
        type: 'narration',
        data: message.data,
        timestamp: new Date()
      }, ws);
      break;
      
    case 'effect_applied':
      broadcastToSession(ws.sessionId, {
        type: 'effect_applied',
        data: message.data,
        timestamp: new Date()
      });
      break;
      
    case 'projection_update':
      broadcastToSession(ws.sessionId, {
        type: 'projection_update',
        data: message.data,
        timestamp: new Date()
      }, ws);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}

function handleJoinSession(ws: ExtendedWebSocket, data: JoinSessionData) {
  ws.sessionId = data.sessionId;
  ws.userId = data.userId;
  
  // Add to session clients
  if (!clients.has(data.sessionId)) {
    clients.set(data.sessionId, new Set());
  }
  clients.get(data.sessionId)!.add(ws);
  
  // Notify others in session
  broadcastToSession(data.sessionId, {
    type: 'user_joined',
    data: { userId: data.userId },
    timestamp: new Date()
  }, ws);
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'joined_session',
    data: { sessionId: data.sessionId },
    timestamp: new Date()
  }));
}

function handleLeaveSession(ws: ExtendedWebSocket) {
  if (ws.sessionId) {
    const sessionClients = clients.get(ws.sessionId);
    if (sessionClients) {
      sessionClients.delete(ws);
      if (sessionClients.size === 0) {
        clients.delete(ws.sessionId);
      } else {
        // Notify others
        broadcastToSession(ws.sessionId, {
          type: 'user_left',
          data: { userId: ws.userId },
          timestamp: new Date()
        }, ws);
      }
    }
  }
  
  ws.sessionId = undefined;
  ws.userId = undefined;
}

export function broadcastToSession(sessionId: string | undefined, message: WSMessage, exclude?: ExtendedWebSocket) {
  if (!sessionId) return;
  
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;
  
  const messageStr = JSON.stringify(message);
  sessionClients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export function broadcastToAll(message: WSMessage) {
  const messageStr = JSON.stringify(message);
  clients.forEach(sessionClients => {
    sessionClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  });
}