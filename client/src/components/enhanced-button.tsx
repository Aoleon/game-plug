import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
  vibration?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, loading, icon, children, vibration = true, disabled, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Micro-interaction vibration feedback
      if (vibration && navigator.vibrate) {
        navigator.vibrate(1);
      }
      onClick?.(event);
    };

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          ref={ref}
          className={cn(
            "transition-all duration-200 relative overflow-hidden",
            "hover:shadow-lg hover:shadow-aged-gold/20",
            "active:shadow-inner",
            loading && "pointer-events-none",
            className
          )}
          disabled={disabled || loading}
          onClick={handleClick}
          {...props}
        >
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-cosmic-void/30 flex items-center justify-center"
            >
              <div className="w-4 h-4 border-2 border-aged-gold border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
          
          <div className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            loading && "opacity-30"
          )}>
            {icon && <span className="text-sm">{icon}</span>}
            {children}
          </div>
        </Button>
      </motion.div>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export default EnhancedButton;