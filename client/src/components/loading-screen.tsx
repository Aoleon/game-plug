import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-black text-aged-gold">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="font-cinzel text-xl">Chargement...</span>
      </div>
    </div>
  );
}
