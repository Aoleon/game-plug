import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

const MAX_HISTORY_SIZE = 100;

export function useWebSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHistoryRef = useRef<WebSocketMessage[]>([]);
  const [historyUpdateTrigger, setHistoryUpdateTrigger] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const toastShownRef = useRef(false);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (!url) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = url.startsWith("ws") ? url : `${protocol}//${window.location.host}${url}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log("WebSocket connected");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          message.timestamp = Date.now();
          setLastMessage(message);
          
          // Optimisation: utiliser ref pour éviter les re-renders à chaque message
          if (messageHistoryRef.current.length >= MAX_HISTORY_SIZE) {
            messageHistoryRef.current = messageHistoryRef.current.slice(-MAX_HISTORY_SIZE + 1);
          }
          messageHistoryRef.current.push(message);
          setHistoryUpdateTrigger(prev => prev + 1);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Reconnection automatique avec backoff exponentiel
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Connexion perdue",
            description: "Impossible de se reconnecter au serveur",
            variant: "destructive",
          });
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setIsConnected(false);
    }
  }, [url, toast]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (url) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  // Mémoiser l'historique pour éviter la création d'un nouveau tableau à chaque render
  const messageHistory = useMemo(() => [...messageHistoryRef.current], [historyUpdateTrigger]);

  return useMemo(() => ({
    isConnected,
    sendMessage,
    lastMessage,
    messageHistory,
    disconnect,
    reconnect: connect,
  }), [isConnected, sendMessage, lastMessage, messageHistory, disconnect, connect]);
}