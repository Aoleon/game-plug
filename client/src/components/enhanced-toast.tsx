import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedToastProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  onClose?: () => void;
  duration?: number;
}

const variantStyles = {
  default: "bg-cosmic-void border-aged-gold text-aged-parchment",
  success: "bg-eldritch-green/20 border-eldritch-green text-eldritch-green",
  warning: "bg-yellow-600/20 border-yellow-600 text-yellow-200",
  error: "bg-blood-burgundy/20 border-blood-burgundy text-blood-burgundy",
  info: "bg-blue-500/20 border-blue-500 text-blue-300"
};

const variantIcons = {
  default: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info
};

export default function EnhancedToast({
  title,
  description,
  variant = "default",
  onClose,
  duration = 4000
}: EnhancedToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const IconComponent = variantIcons[variant];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all",
        "eldritch-glow hover:shadow-xl cursor-pointer",
        "max-w-sm min-w-[300px]",
        variantStyles[variant]
      )}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-cinzel text-sm font-medium leading-tight"
          >
            {title}
          </motion.h3>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-1 text-xs opacity-90 leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>
        
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>
      
      {/* Progress bar for duration */}
      {duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}