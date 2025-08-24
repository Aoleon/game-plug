import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Volume2, VolumeX, Music, MapPin, BookOpen, 
  Sparkles, FileText, Clock, Wind, Zap, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AmbientSound {
  id: string;
  name: string;
  category: 'atmosphere' | 'location' | 'event';
  icon: any;
  description: string;
  mood: string;
  createSound: (audioContext: AudioContext, volume: number) => () => void;
}

// Atmospheric base sounds
const ATMOSPHERIC_SOUNDS: AmbientSound[] = [
  {
    id: 'deep-cave',
    name: 'Caverne Profonde',
    category: 'atmosphere',
    icon: Wind,
    description: 'Échos profonds et réverbérations caverneuses',
    mood: 'Oppressant',
    createSound: (audioContext: AudioContext, volume: number) => {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator1.frequency.value = 40;
      oscillator2.type = 'triangle';
      oscillator2.frequency.value = 60;
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 10;
      
      lfo.type = 'sine';
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 20;
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator1.frequency);
      lfoGain.connect(oscillator2.frequency);
      
      oscillator1.connect(filter);
      oscillator2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = volume * 0.15;
      
      oscillator1.start();
      oscillator2.start();
      lfo.start();
      
      return () => {
        oscillator1.stop();
        oscillator2.stop();
        lfo.stop();
        oscillator1.disconnect();
        oscillator2.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      };
    }
  },
  {
    id: 'eldritch-whispers',
    name: 'Murmures Eldritch',
    category: 'atmosphere',
    icon: Brain,
    description: 'Chuchotements inquiétants venus d\'ailleurs',
    mood: 'Mystérieux',
    createSound: (audioContext: AudioContext, volume: number) => {
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      const filter1 = audioContext.createBiquadFilter();
      const filter2 = audioContext.createBiquadFilter();
      const gainNode = audioContext.createGain();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      
      filter1.type = 'bandpass';
      filter1.frequency.value = 1000;
      filter1.Q.value = 20;
      
      filter2.type = 'highpass';
      filter2.frequency.value = 500;
      
      lfo.type = 'sine';
      lfo.frequency.value = 3;
      lfoGain.gain.value = 500;
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter1.frequency);
      
      noiseSource.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = volume * 0.08;
      
      noiseSource.start();
      lfo.start();
      
      return () => {
        noiseSource.stop();
        lfo.stop();
        noiseSource.disconnect();
        filter1.disconnect();
        filter2.disconnect();
        gainNode.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      };
    }
  },
  {
    id: 'sinister-heartbeat',
    name: 'Battement Sinistre',
    category: 'atmosphere',
    icon: Zap,
    description: 'Pulsation rythmique d\'une présence ancienne',
    mood: 'Menaçant',
    createSound: (audioContext: AudioContext, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 50;
      
      filter.type = 'lowpass';
      filter.frequency.value = 100;
      filter.Q.value = 5;
      
      const beatPattern = () => {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.2, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        gainNode.gain.setValueAtTime(0, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, now + 0.35);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
      };
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      const beatInterval = setInterval(beatPattern, 800);
      beatPattern();
      
      return () => {
        clearInterval(beatInterval);
        oscillator.stop();
        oscillator.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      };
    }
  }
];

// Location-specific sounds
const LOCATION_SOUNDS: AmbientSound[] = [
  {
    id: 'forbidden-library',
    name: 'Bibliothèque Interdite',
    category: 'location',
    icon: BookOpen,
    description: 'Pages qui tournent, craquements de bois ancien',
    mood: 'Studieux',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Paper rustling effect
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
      }
      
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      
      // Wood creaking
      const creakOsc = audioContext.createOscillator();
      const creakGain = audioContext.createGain();
      creakOsc.frequency.value = 150;
      creakOsc.type = 'sawtooth';
      
      const playRustle = () => {
        const source = audioContext.createBufferSource();
        source.buffer = noiseBuffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.1, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        
        source.start(now);
        
        // Random creak
        if (Math.random() > 0.7) {
          creakGain.gain.setValueAtTime(0, now);
          creakGain.gain.linearRampToValueAtTime(volume * 0.05, now + 0.1);
          creakGain.gain.linearRampToValueAtTime(0, now + 0.3);
        }
      };
      
      creakOsc.connect(creakGain);
      creakGain.connect(audioContext.destination);
      creakOsc.start();
      
      const rustleInterval = setInterval(playRustle, 3000 + Math.random() * 2000);
      playRustle();
      
      return () => {
        clearInterval(rustleInterval);
        creakOsc.stop();
        creakOsc.disconnect();
        creakGain.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      };
    }
  },
  {
    id: 'forgotten-crypt',
    name: 'Crypte Oubliée',
    category: 'location',
    icon: MapPin,
    description: 'Gouttes d\'eau, échos distants, pierre froide',
    mood: 'Humide',
    createSound: (audioContext: AudioContext, volume: number) => {
      const reverb = audioContext.createConvolver();
      const reverbBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 3, audioContext.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = reverbBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2);
        }
      }
      reverb.buffer = reverbBuffer;
      
      const playDrip = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.frequency.value = 800 + Math.random() * 400;
        osc.type = 'sine';
        
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 10;
        
        const now = audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(reverb);
        reverb.connect(audioContext.destination);
        
        osc.start(now);
        osc.stop(now + 0.3);
        
        setTimeout(() => {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        }, 400);
      };
      
      const dripInterval = setInterval(playDrip, 2000 + Math.random() * 3000);
      playDrip();
      
      return () => {
        clearInterval(dripInterval);
        reverb.disconnect();
      };
    }
  },
  {
    id: 'abandoned-manor',
    name: 'Manoir Abandonné',
    category: 'location',
    icon: FileText,
    description: 'Planchers grinçants, vent dans les fissures',
    mood: 'Désolé',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Wind through cracks
      const windNoise = audioContext.createBufferSource();
      const windBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
      const windData = windBuffer.getChannelData(0);
      for (let i = 0; i < windData.length; i++) {
        windData[i] = (Math.random() * 2 - 1) * 0.1;
      }
      windNoise.buffer = windBuffer;
      windNoise.loop = true;
      
      const windFilter = audioContext.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 400;
      windFilter.Q.value = 2;
      
      const windGain = audioContext.createGain();
      const windLFO = audioContext.createOscillator();
      const windLFOGain = audioContext.createGain();
      
      windLFO.frequency.value = 0.3;
      windLFOGain.gain.value = 200;
      
      windLFO.connect(windLFOGain);
      windLFOGain.connect(windFilter.frequency);
      
      windNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(audioContext.destination);
      
      windGain.gain.value = volume * 0.08;
      
      // Floor creaking
      const creakOsc = audioContext.createOscillator();
      const creakGain = audioContext.createGain();
      creakOsc.type = 'square';
      creakOsc.frequency.value = 80;
      
      const playCreak = () => {
        const now = audioContext.currentTime;
        const freq = 60 + Math.random() * 40;
        creakOsc.frequency.setValueAtTime(freq, now);
        creakOsc.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.2);
        
        creakGain.gain.setValueAtTime(0, now);
        creakGain.gain.linearRampToValueAtTime(volume * 0.06, now + 0.05);
        creakGain.gain.linearRampToValueAtTime(0, now + 0.2);
      };
      
      creakOsc.connect(creakGain);
      creakGain.connect(audioContext.destination);
      
      windNoise.start();
      windLFO.start();
      creakOsc.start();
      
      const creakInterval = setInterval(playCreak, 4000 + Math.random() * 3000);
      
      return () => {
        clearInterval(creakInterval);
        windNoise.stop();
        windLFO.stop();
        creakOsc.stop();
        windNoise.disconnect();
        windFilter.disconnect();
        windGain.disconnect();
        windLFO.disconnect();
        windLFOGain.disconnect();
        creakOsc.disconnect();
        creakGain.disconnect();
      };
    }
  },
  {
    id: 'ritual-chamber',
    name: 'Chambre Rituelle',
    category: 'event',
    icon: Sparkles,
    description: 'Chants mystiques, crépitement de bougies',
    mood: 'Mystique',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Mystical drone
      const droneOsc1 = audioContext.createOscillator();
      const droneOsc2 = audioContext.createOscillator();
      const droneGain = audioContext.createGain();
      const droneFilter = audioContext.createBiquadFilter();
      
      droneOsc1.type = 'sine';
      droneOsc1.frequency.value = 110; // A2
      droneOsc2.type = 'sine';
      droneOsc2.frequency.value = 165; // E3 (fifth)
      
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 500;
      droneFilter.Q.value = 5;
      
      // Candle crackling
      const crackleNoise = audioContext.createBufferSource();
      const crackleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate);
      const crackleData = crackleBuffer.getChannelData(0);
      for (let i = 0; i < crackleData.length; i++) {
        crackleData[i] = (Math.random() * 2 - 1) * 0.5;
      }
      crackleNoise.buffer = crackleBuffer;
      crackleNoise.loop = true;
      
      const crackleFilter = audioContext.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 3000;
      
      const crackleGain = audioContext.createGain();
      
      // Connect drone
      droneOsc1.connect(droneFilter);
      droneOsc2.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(audioContext.destination);
      
      // Connect crackle
      crackleNoise.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(audioContext.destination);
      
      droneGain.gain.value = volume * 0.08;
      crackleGain.gain.value = volume * 0.02;
      
      droneOsc1.start();
      droneOsc2.start();
      crackleNoise.start();
      
      // Occasional chant-like swells
      const chantInterval = setInterval(() => {
        const now = audioContext.currentTime;
        droneGain.gain.linearRampToValueAtTime(volume * 0.12, now + 1);
        droneGain.gain.linearRampToValueAtTime(volume * 0.08, now + 3);
      }, 6000);
      
      return () => {
        clearInterval(chantInterval);
        droneOsc1.stop();
        droneOsc2.stop();
        crackleNoise.stop();
        droneOsc1.disconnect();
        droneOsc2.disconnect();
        droneFilter.disconnect();
        droneGain.disconnect();
        crackleNoise.disconnect();
        crackleFilter.disconnect();
        crackleGain.disconnect();
      };
    }
  }
];

interface UnifiedAmbientControllerProps {
  className?: string;
  onAmbientChange?: (soundId: string | null, category: string) => void;
}

export default function UnifiedAmbientController({ 
  className, 
  onAmbientChange 
}: UnifiedAmbientControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'atmosphere' | 'location' | 'event'>('all');
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopSoundRef = useRef<(() => void) | null>(null);

  const allSounds = [...ATMOSPHERIC_SOUNDS, ...LOCATION_SOUNDS];
  const filteredSounds = selectedCategory === 'all' 
    ? allSounds 
    : allSounds.filter(s => s.category === selectedCategory);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (stopSoundRef.current) {
        stopSoundRef.current();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = (sound: AmbientSound) => {
    if (!audioContextRef.current) return;
    
    // Stop current sound if playing
    if (stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
    
    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    // Start new sound
    stopSoundRef.current = sound.createSound(audioContextRef.current, volume);
    setSelectedSound(sound.id);
    setIsPlaying(true);
    
    if (onAmbientChange) {
      onAmbientChange(sound.id, sound.category);
    }
  };

  const stopSound = () => {
    if (stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
    setIsPlaying(false);
    setSelectedSound(null);
    
    if (onAmbientChange) {
      onAmbientChange(null, '');
    }
  };

  const toggleSound = (sound: AmbientSound) => {
    if (isPlaying && selectedSound === sound.id) {
      stopSound();
    } else {
      playSound(sound);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    
    // Restart sound with new volume if playing
    if (isPlaying && selectedSound) {
      const sound = allSounds.find(s => s.id === selectedSound);
      if (sound) {
        playSound(sound);
      }
    }
  };

  return (
    <Card className={cn("bg-gray-900/50 border-aged-gold/20", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-cinzel text-aged-gold">
            <Music className="h-5 w-5" />
            Ambiances Sonores
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isPlaying ? stopSound() : null}
            className={cn(
              "transition-colors",
              isPlaying ? "text-aged-gold" : "text-gray-500"
            )}
            data-testid="button-toggle-ambient"
          >
            {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <VolumeX className="h-4 w-4 text-gray-500" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="flex-1"
            data-testid="slider-volume"
          />
          <Volume2 className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-500 w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="atmosphere">Atmosphère</TabsTrigger>
            <TabsTrigger value="location">Lieux</TabsTrigger>
            <TabsTrigger value="event">Événements</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredSounds.map((sound) => {
                  const Icon = sound.icon;
                  const isActive = selectedSound === sound.id && isPlaying;
                  
                  return (
                    <motion.div
                      key={sound.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all p-3",
                          isActive
                            ? "bg-aged-gold/20 border-aged-gold shadow-lg shadow-aged-gold/20"
                            : "bg-gray-800/50 border-gray-700 hover:border-aged-gold/50"
                        )}
                        onClick={() => toggleSound(sound)}
                        data-testid={`ambient-${sound.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full transition-colors",
                            isActive ? "bg-aged-gold/30" : "bg-gray-700/50"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5 transition-colors",
                              isActive ? "text-aged-gold" : "text-gray-400"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={cn(
                                "font-semibold transition-colors",
                                isActive ? "text-aged-gold" : "text-aged-parchment"
                              )}>
                                {sound.name}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs transition-colors",
                                  isActive ? "border-aged-gold text-aged-gold" : ""
                                )}
                              >
                                {sound.mood}
                              </Badge>
                            </div>
                            <p className="text-sm text-aged-parchment/70">
                              {sound.description}
                            </p>
                            {isActive && (
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="mt-2 flex items-center gap-2"
                                >
                                  <div className="flex gap-1">
                                    {[1, 2, 3].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1 h-3 bg-aged-gold rounded-full"
                                        animate={{
                                          scaleY: [1, 1.5, 1],
                                        }}
                                        transition={{
                                          duration: 0.5,
                                          repeat: Infinity,
                                          delay: i * 0.1,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-aged-gold">
                                    En lecture...
                                  </span>
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Currently Playing Indicator */}
        {isPlaying && selectedSound && (
          <div className="mt-4 p-3 bg-aged-gold/10 border border-aged-gold/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-aged-gold animate-pulse" />
                <span className="text-sm text-aged-gold">
                  {allSounds.find(s => s.id === selectedSound)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSound}
                className="text-aged-gold hover:text-aged-parchment"
                data-testid="button-stop-ambient"
              >
                Arrêter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}