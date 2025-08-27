import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export default function ConnectionIndicator({ isConnected, className }: ConnectionIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isConnected ? "connected" : "disconnected"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isConnected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500",
          className
        )}
        data-testid={`connection-status-${isConnected ? 'connected' : 'disconnected'}`}
      >
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connecté</span>
            <motion.div
              key="pulse-indicator"
              className="h-2 w-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Déconnecté</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}