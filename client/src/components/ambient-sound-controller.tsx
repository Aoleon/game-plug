import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Skull, Wind, Heart } from "lucide-react";
import { useDiceSound } from "@/components/dice-sound-manager";

type AmbientType = 'cave' | 'whispers' | 'heartbeat';

interface AmbientSoundControllerProps {
  className?: string;
}

export default function AmbientSoundController({ className = "" }: AmbientSoundControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientType>('cave');
  const [volume, setVolume] = useState(50);
  const { playAmbient, stopAmbient } = useDiceSound();

  const toggleAmbient = () => {
    if (isPlaying) {
      stopAmbient();
      setIsPlaying(false);
    } else {
      playAmbient(ambientType);
      setIsPlaying(true);
    }
  };

  const changeAmbientType = (type: AmbientType) => {
    setAmbientType(type);
    if (isPlaying) {
      stopAmbient();
      playAmbient(type);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, [stopAmbient]);

  const getAmbientIcon = () => {
    switch (ambientType) {
      case 'cave':
        return <Wind className="h-4 w-4" />;
      case 'whispers':
        return <Skull className="h-4 w-4" />;
      case 'heartbeat':
        return <Heart className="h-4 w-4" />;
    }
  };

  const getAmbientName = () => {
    switch (ambientType) {
      case 'cave':
        return 'Caverne Profonde';
      case 'whispers':
        return 'Murmures Eldritch';
      case 'heartbeat':
        return 'Battement Sinistre';
    }
  };

  return (
    <Card className={`bg-cosmic-void border-aged-gold p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-sm text-aged-gold">Ambiance Sonore</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAmbient}
            className={`text-aged-gold hover:text-bone-white ${isPlaying ? 'bg-aged-gold/20' : ''}`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="h-4 w-4 mr-1" />
                Actif
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-1" />
                Inactif
              </>
            )}
          </Button>
        </div>

        <Select value={ambientType} onValueChange={(value) => changeAmbientType(value as AmbientType)}>
          <SelectTrigger className="bg-deep-black border-aged-gold text-bone-white">
            <SelectValue>
              <div className="flex items-center gap-2">
                {getAmbientIcon()}
                <span>{getAmbientName()}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-cosmic-void border-aged-gold">
            <SelectItem value="cave">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                <span>Caverne Profonde</span>
              </div>
            </SelectItem>
            <SelectItem value="whispers">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4" />
                <span>Murmures Eldritch</span>
              </div>
            </SelectItem>
            <SelectItem value="heartbeat">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Battement Sinistre</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="text-xs text-aged-parchment">
          {ambientType === 'cave' && "Sons caverneux profonds avec réverbération mystérieuse"}
          {ambientType === 'whispers' && "Murmures inquiétants venus d'autres dimensions"}
          {ambientType === 'heartbeat' && "Pulsation rythmique évoquant une présence ancienne"}
        </div>
      </div>
    </Card>
  );
}