import { memo } from "react";

interface LoadingScreenProps {
  pleinePage?: boolean;
  message?: string;
}

function LoadingScreen({ pleinePage = true, message = "Chargement..." }: LoadingScreenProps) {
  return (
    <div
      className={`flex items-center justify-center bg-deep-black text-aged-gold ${
        pleinePage ? "min-h-screen" : "py-12"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-aged-gold/30 border-t-aged-gold" />
        <p className="font-cinzel text-lg">{message}</p>
      </div>
    </div>
  );
}

export default memo(LoadingScreen);
