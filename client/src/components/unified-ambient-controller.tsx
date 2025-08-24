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
    id: 'cosmic-void',
    name: 'Vide Cosmique',
    category: 'atmosphere',
    icon: Sparkles,
    description: 'L\'infini glacial entre les étoiles',
    mood: 'Vertigineux',
    createSound: (audioContext: AudioContext, volume: number) => {
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      const filters: BiquadFilterNode[] = [];
      
      // Create multiple layers of cosmic drones
      for (let i = 0; i < 4; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 30 + i * 15;
        
        filter.type = 'lowpass';
        filter.frequency.value = 100 + i * 50;
        filter.Q.value = 15;
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + i * 0.02;
        lfoGain.gain.value = 5 + i * 2;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        gain.gain.value = volume * 0.08 / (i + 1);
        
        osc.start();
        lfo.start();
        
        oscillators.push(osc, lfo);
        gains.push(gain, lfoGain);
        filters.push(filter);
      }
      
      return () => {
        oscillators.forEach(osc => {
          osc.stop();
          osc.disconnect();
        });
        gains.forEach(gain => gain.disconnect());
        filters.forEach(filter => filter.disconnect());
      };
    }
  },
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
    id: 'underwater-abyss',
    name: 'Abysses Sous-marines',
    category: 'atmosphere',
    icon: Wind,
    description: 'Les profondeurs insondables de l\'océan',
    mood: 'Écrasant',
    createSound: (audioContext: AudioContext, volume: number) => {
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.2;
      }
      
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      const filter1 = audioContext.createBiquadFilter();
      const filter2 = audioContext.createBiquadFilter();
      const gainNode = audioContext.createGain();
      
      filter1.type = 'lowpass';
      filter1.frequency.value = 400;
      filter1.Q.value = 2;
      
      filter2.type = 'bandpass';
      filter2.frequency.value = 200;
      filter2.Q.value = 0.5;
      
      const whale = audioContext.createOscillator();
      const whaleGain = audioContext.createGain();
      whale.type = 'sine';
      whale.frequency.value = 80;
      
      noiseSource.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(gainNode);
      whale.connect(whaleGain);
      whaleGain.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = volume * 0.15;
      whaleGain.gain.value = volume * 0.05;
      
      noiseSource.start();
      whale.start();
      
      return () => {
        noiseSource.stop();
        whale.stop();
        noiseSource.disconnect();
        whale.disconnect();
        filter1.disconnect();
        filter2.disconnect();
        gainNode.disconnect();
        whaleGain.disconnect();
      };
    }
  },
  {
    id: 'maddening-static',
    name: 'Statique de la Folie',
    category: 'atmosphere',
    icon: Brain,
    description: 'Interférences mentales et distorsions psychiques',
    mood: 'Dérangeant',
    createSound: (audioContext: AudioContext, volume: number) => {
      const staticBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
      const staticData = staticBuffer.getChannelData(0);
      
      for (let i = 0; i < staticData.length; i++) {
        staticData[i] = (Math.random() * 2 - 1) * 0.3 * (Math.sin(i * 0.001) + 1);
      }
      
      const staticSource = audioContext.createBufferSource();
      staticSource.buffer = staticBuffer;
      staticSource.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      const distortion = audioContext.createWaveShaper();
      const gainNode = audioContext.createGain();
      
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i - 128) / 128;
        curve[i] = Math.tanh(x * 5);
      }
      distortion.curve = curve;
      
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 5;
      
      staticSource.connect(filter);
      filter.connect(distortion);
      distortion.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = volume * 0.08;
      staticSource.start();
      
      return () => {
        staticSource.stop();
        staticSource.disconnect();
        filter.disconnect();
        distortion.disconnect();
        gainNode.disconnect();
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
    id: 'arkham-streets',
    name: 'Rues d\'Arkham',
    category: 'location',
    icon: MapPin,
    description: 'Nuit brumeuse dans les rues désertées',
    mood: 'Inquiétant',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Distant foghorn
      const foghorn = audioContext.createOscillator();
      const foghornGain = audioContext.createGain();
      const foghornFilter = audioContext.createBiquadFilter();
      
      foghorn.type = 'sawtooth';
      foghorn.frequency.value = 55;
      foghornFilter.type = 'lowpass';
      foghornFilter.frequency.value = 200;
      
      // Wind howling
      const windBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
      const windData = windBuffer.getChannelData(0);
      for (let i = 0; i < windData.length; i++) {
        windData[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const windSource = audioContext.createBufferSource();
      windSource.buffer = windBuffer;
      windSource.loop = true;
      
      const windFilter = audioContext.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 800;
      windFilter.Q.value = 1;
      
      const windGain = audioContext.createGain();
      
      // Distant footsteps
      const playFootstep = () => {
        const step = audioContext.createOscillator();
        const stepGain = audioContext.createGain();
        const stepFilter = audioContext.createBiquadFilter();
        
        step.type = 'square';
        step.frequency.value = 60 + Math.random() * 20;
        stepFilter.type = 'lowpass';
        stepFilter.frequency.value = 150;
        
        const now = audioContext.currentTime;
        stepGain.gain.setValueAtTime(0, now);
        stepGain.gain.linearRampToValueAtTime(volume * 0.02, now + 0.01);
        stepGain.gain.linearRampToValueAtTime(0, now + 0.05);
        
        step.connect(stepFilter);
        stepFilter.connect(stepGain);
        stepGain.connect(audioContext.destination);
        
        step.start(now);
        step.stop(now + 0.05);
      };
      
      foghorn.connect(foghornFilter);
      foghornFilter.connect(foghornGain);
      foghornGain.connect(audioContext.destination);
      
      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(audioContext.destination);
      
      foghornGain.gain.value = volume * 0.03;
      windGain.gain.value = volume * 0.06;
      
      foghorn.start();
      windSource.start();
      
      const footstepInterval = setInterval(() => {
        if (Math.random() > 0.6) playFootstep();
      }, 2000);
      
      return () => {
        clearInterval(footstepInterval);
        foghorn.stop();
        windSource.stop();
        foghorn.disconnect();
        windSource.disconnect();
        foghornFilter.disconnect();
        windFilter.disconnect();
        foghornGain.disconnect();
        windGain.disconnect();
      };
    }
  },
  {
    id: 'miskatonic-university',
    name: 'Université Miskatonic',
    category: 'location',
    icon: BookOpen,
    description: 'Couloirs silencieux et salles d\'étude anciennes',
    mood: 'Académique',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Clock ticking
      const tick = () => {
        const tickOsc = audioContext.createOscillator();
        const tickGain = audioContext.createGain();
        tickOsc.type = 'square';
        tickOsc.frequency.value = 4000;
        
        const now = audioContext.currentTime;
        tickGain.gain.setValueAtTime(0, now);
        tickGain.gain.linearRampToValueAtTime(volume * 0.03, now + 0.001);
        tickGain.gain.linearRampToValueAtTime(0, now + 0.01);
        
        tickOsc.connect(tickGain);
        tickGain.connect(audioContext.destination);
        tickOsc.start(now);
        tickOsc.stop(now + 0.01);
      };
      
      // Ambient room tone
      const roomTone = audioContext.createOscillator();
      const roomGain = audioContext.createGain();
      const roomFilter = audioContext.createBiquadFilter();
      
      roomTone.type = 'sine';
      roomTone.frequency.value = 60;
      roomFilter.type = 'lowpass';
      roomFilter.frequency.value = 100;
      
      roomTone.connect(roomFilter);
      roomFilter.connect(roomGain);
      roomGain.connect(audioContext.destination);
      roomGain.gain.value = volume * 0.02;
      
      roomTone.start();
      
      const tickInterval = setInterval(tick, 1000);
      
      return () => {
        clearInterval(tickInterval);
        roomTone.stop();
        roomTone.disconnect();
        roomFilter.disconnect();
        roomGain.disconnect();
      };
    }
  },
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
    id: 'ancient-temple',
    name: 'Temple Antique',
    category: 'location',
    icon: Sparkles,
    description: 'Chants lointains et résonances mystiques',
    mood: 'Sacré',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Gregorian-like chanting
      const voices: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      
      const frequencies = [110, 165, 220, 275]; // Harmonies mystiques
      
      frequencies.forEach((freq, i) => {
        const voice = audioContext.createOscillator();
        const voiceGain = audioContext.createGain();
        const vibrato = audioContext.createOscillator();
        const vibratoGain = audioContext.createGain();
        
        voice.type = 'sine';
        voice.frequency.value = freq;
        
        vibrato.type = 'sine';
        vibrato.frequency.value = 4 + i * 0.5;
        vibratoGain.gain.value = 2;
        
        vibrato.connect(vibratoGain);
        vibratoGain.connect(voice.frequency);
        
        voice.connect(voiceGain);
        voiceGain.connect(audioContext.destination);
        
        voiceGain.gain.value = volume * 0.03 / (i + 1);
        
        voice.start();
        vibrato.start();
        
        voices.push(voice, vibrato);
        gains.push(voiceGain, vibratoGain);
      });
      
      // Bell resonance
      const bell = audioContext.createOscillator();
      const bellGain = audioContext.createGain();
      const bellFilter = audioContext.createBiquadFilter();
      
      bell.type = 'triangle';
      bell.frequency.value = 440;
      bellFilter.type = 'bandpass';
      bellFilter.frequency.value = 440;
      bellFilter.Q.value = 30;
      
      const ringBell = () => {
        const now = audioContext.currentTime;
        bellGain.gain.cancelScheduledValues(now);
        bellGain.gain.setValueAtTime(volume * 0.1, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      };
      
      bell.connect(bellFilter);
      bellFilter.connect(bellGain);
      bellGain.connect(audioContext.destination);
      
      bell.start();
      
      const bellInterval = setInterval(ringBell, 10000);
      ringBell();
      
      return () => {
        clearInterval(bellInterval);
        voices.forEach(v => {
          v.stop();
          v.disconnect();
        });
        gains.forEach(g => g.disconnect());
        bell.stop();
        bell.disconnect();
        bellFilter.disconnect();
        bellGain.disconnect();
      };
    }
  },
  {
    id: 'innsmouth-harbor',
    name: 'Port d\'Innsmouth',
    category: 'location',
    icon: MapPin,
    description: 'Vagues contre les quais, mouettes et brume marine',
    mood: 'Maritime',
    createSound: (audioContext: AudioContext, volume: number) => {
      // Ocean waves
      const waveBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
      const waveData = waveBuffer.getChannelData(0);
      
      for (let i = 0; i < waveData.length; i++) {
        const envelope = Math.sin((i / waveData.length) * Math.PI);
        waveData[i] = (Math.random() * 2 - 1) * envelope * 0.3;
      }
      
      const waveSource = audioContext.createBufferSource();
      waveSource.buffer = waveBuffer;
      waveSource.loop = true;
      
      const waveFilter = audioContext.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.value = 600;
      
      const waveGain = audioContext.createGain();
      
      // Seagulls
      const playSeagull = () => {
        const gull = audioContext.createOscillator();
        const gullGain = audioContext.createGain();
        const gullFilter = audioContext.createBiquadFilter();
        
        gull.type = 'sawtooth';
        gullFilter.type = 'bandpass';
        gullFilter.frequency.value = 2000;
        gullFilter.Q.value = 5;
        
        const now = audioContext.currentTime;
        const freq = 800 + Math.random() * 400;
        
        gull.frequency.setValueAtTime(freq, now);
        gull.frequency.linearRampToValueAtTime(freq * 1.2, now + 0.2);
        gull.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.4);
        
        gullGain.gain.setValueAtTime(0, now);
        gullGain.gain.linearRampToValueAtTime(volume * 0.05, now + 0.1);
        gullGain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        gull.connect(gullFilter);
        gullFilter.connect(gullGain);
        gullGain.connect(audioContext.destination);
        
        gull.start(now);
        gull.stop(now + 0.5);
      };
      
      // Creaking boats
      const boatCreak = audioContext.createOscillator();
      const boatGain = audioContext.createGain();
      boatCreak.type = 'square';
      boatCreak.frequency.value = 40;
      
      waveSource.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(audioContext.destination);
      
      boatCreak.connect(boatGain);
      boatGain.connect(audioContext.destination);
      
      waveGain.gain.value = volume * 0.12;
      boatGain.gain.value = volume * 0.02;
      
      waveSource.start();
      boatCreak.start();
      
      const seagullInterval = setInterval(() => {
        if (Math.random() > 0.5) playSeagull();
      }, 5000);
      
      return () => {
        clearInterval(seagullInterval);
        waveSource.stop();
        boatCreak.stop();
        waveSource.disconnect();
        boatCreak.disconnect();
        waveFilter.disconnect();
        waveGain.disconnect();
        boatGain.disconnect();
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
    category: 'location',
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

// Event-specific sounds
const EVENT_SOUNDS: AmbientSound[] = [
  {
    id: 'shoggoth-approach',
    name: 'Approche du Shoggoth',
    category: 'event',
    icon: Brain,
    description: 'Masse protoplasmique bouillonnante qui approche',
    mood: 'Terreur',
    createSound: (audioContext: AudioContext, volume: number) => {
      const bubbleNodes: any[] = [];
      
      const createBubble = () => {
        const bubble = audioContext.createOscillator();
        const bubbleGain = audioContext.createGain();
        const bubbleFilter = audioContext.createBiquadFilter();
        
        bubble.type = 'sine';
        bubble.frequency.value = 50 + Math.random() * 100;
        
        bubbleFilter.type = 'lowpass';
        bubbleFilter.frequency.value = 200;
        bubbleFilter.Q.value = 10;
        
        const now = audioContext.currentTime;
        bubbleGain.gain.setValueAtTime(0, now);
        bubbleGain.gain.linearRampToValueAtTime(volume * 0.1, now + 0.05);
        bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        bubble.connect(bubbleFilter);
        bubbleFilter.connect(bubbleGain);
        bubbleGain.connect(audioContext.destination);
        
        bubble.start(now);
        bubble.stop(now + 0.2);
        
        bubbleNodes.push({ bubble, bubbleGain, bubbleFilter });
      };
      
      const slide = audioContext.createOscillator();
      const slideGain = audioContext.createGain();
      const slideFilter = audioContext.createBiquadFilter();
      const slideLFO = audioContext.createOscillator();
      const slideLFOGain = audioContext.createGain();
      
      slide.type = 'sawtooth';
      slide.frequency.value = 30;
      
      slideFilter.type = 'lowpass';
      slideFilter.frequency.value = 150;
      
      slideLFO.type = 'sine';
      slideLFO.frequency.value = 0.3;
      slideLFOGain.gain.value = 20;
      
      slideLFO.connect(slideLFOGain);
      slideLFOGain.connect(slide.frequency);
      
      slide.connect(slideFilter);
      slideFilter.connect(slideGain);
      slideGain.connect(audioContext.destination);
      
      slideGain.gain.value = volume * 0.08;
      
      slide.start();
      slideLFO.start();
      
      const bubbleInterval = setInterval(createBubble, 100);
      
      return () => {
        clearInterval(bubbleInterval);
        slide.stop();
        slideLFO.stop();
        slide.disconnect();
        slideLFO.disconnect();
        slideFilter.disconnect();
        slideGain.disconnect();
        slideLFOGain.disconnect();
        bubbleNodes.forEach(({ bubble, bubbleGain, bubbleFilter }) => {
          try {
            bubble.disconnect();
            bubbleGain.disconnect();
            bubbleFilter.disconnect();
          } catch(e) {}
        });
      };
    }
  },
  {
    id: 'chase-sequence',
    name: 'Poursuite Effrénée',
    category: 'event',
    icon: Zap,
    description: 'Course contre une horreur indicible',
    mood: 'Panique',
    createSound: (audioContext: AudioContext, volume: number) => {
      const heart = audioContext.createOscillator();
      const heartGain = audioContext.createGain();
      const heartFilter = audioContext.createBiquadFilter();
      
      heart.type = 'sine';
      heart.frequency.value = 60;
      heartFilter.type = 'lowpass';
      heartFilter.frequency.value = 150;
      
      const heartbeat = () => {
        const now = audioContext.currentTime;
        heartGain.gain.cancelScheduledValues(now);
        heartGain.gain.setValueAtTime(0, now);
        heartGain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.02);
        heartGain.gain.linearRampToValueAtTime(0, now + 0.05);
        heartGain.gain.setValueAtTime(0, now + 0.1);
        heartGain.gain.linearRampToValueAtTime(volume * 0.12, now + 0.12);
        heartGain.gain.linearRampToValueAtTime(0, now + 0.15);
      };
      
      const breath = audioContext.createBufferSource();
      const breathBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
      const breathData = breathBuffer.getChannelData(0);
      for (let i = 0; i < breathData.length; i++) {
        breathData[i] = (Math.random() * 2 - 1) * 0.2;
      }
      breath.buffer = breathBuffer;
      breath.loop = true;
      
      const breathFilter = audioContext.createBiquadFilter();
      const breathGain = audioContext.createGain();
      const breathLFO = audioContext.createOscillator();
      const breathLFOGain = audioContext.createGain();
      
      breathFilter.type = 'bandpass';
      breathFilter.frequency.value = 1000;
      breathFilter.Q.value = 2;
      
      breathLFO.type = 'sine';
      breathLFO.frequency.value = 0.3;
      breathLFOGain.gain.value = 0.05;
      
      breathLFO.connect(breathLFOGain);
      breathLFOGain.connect(breathGain.gain);
      
      const runningSteps = () => {
        const step = audioContext.createOscillator();
        const stepGain = audioContext.createGain();
        step.type = 'square';
        step.frequency.value = 80 + Math.random() * 40;
        
        const now = audioContext.currentTime;
        stepGain.gain.setValueAtTime(0, now);
        stepGain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.01);
        stepGain.gain.linearRampToValueAtTime(0, now + 0.05);
        
        step.connect(stepGain);
        stepGain.connect(audioContext.destination);
        step.start(now);
        step.stop(now + 0.05);
      };
      
      heart.connect(heartFilter);
      heartFilter.connect(heartGain);
      heartGain.connect(audioContext.destination);
      
      breath.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(audioContext.destination);
      
      heart.start();
      breath.start();
      breathLFO.start();
      
      breathGain.gain.value = volume * 0.06;
      
      const heartInterval = setInterval(heartbeat, 300);
      const stepInterval = setInterval(runningSteps, 150);
      
      return () => {
        clearInterval(heartInterval);
        clearInterval(stepInterval);
        heart.stop();
        breath.stop();
        breathLFO.stop();
        heart.disconnect();
        breath.disconnect();
        breathLFO.disconnect();
        heartFilter.disconnect();
        breathFilter.disconnect();
        heartGain.disconnect();
        breathGain.disconnect();
        breathLFOGain.disconnect();
      };
    }
  },
  {
    id: 'investigation-tension',
    name: 'Investigation Tendue',
    category: 'event',
    icon: FileText,
    description: 'Recherche d\'indices dans un silence pesant',
    mood: 'Suspense',
    createSound: (audioContext: AudioContext, volume: number) => {
      const drone = audioContext.createOscillator();
      const droneGain = audioContext.createGain();
      const droneFilter = audioContext.createBiquadFilter();
      
      drone.type = 'triangle';
      drone.frequency.value = 55;
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 100;
      
      const investigationSound = () => {
        if (Math.random() > 0.7) {
          const sound = audioContext.createOscillator();
          const soundGain = audioContext.createGain();
          const soundFilter = audioContext.createBiquadFilter();
          
          sound.type = Math.random() > 0.5 ? 'sine' : 'triangle';
          sound.frequency.value = 200 + Math.random() * 800;
          
          soundFilter.type = 'bandpass';
          soundFilter.frequency.value = sound.frequency.value;
          soundFilter.Q.value = 10;
          
          const now = audioContext.currentTime;
          const duration = 0.1 + Math.random() * 0.3;
          
          soundGain.gain.setValueAtTime(0, now);
          soundGain.gain.linearRampToValueAtTime(volume * 0.02, now + 0.01);
          soundGain.gain.linearRampToValueAtTime(0, now + duration);
          
          sound.connect(soundFilter);
          soundFilter.connect(soundGain);
          soundGain.connect(audioContext.destination);
          
          sound.start(now);
          sound.stop(now + duration);
        }
      };
      
      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(audioContext.destination);
      
      droneGain.gain.value = volume * 0.04;
      
      drone.start();
      
      const soundInterval = setInterval(investigationSound, 2000);
      
      return () => {
        clearInterval(soundInterval);
        drone.stop();
        drone.disconnect();
        droneFilter.disconnect();
        droneGain.disconnect();
      };
    }
  },
  {
    id: 'elder-thing-awakening',
    name: 'Réveil de l\'Ancien',
    category: 'event',
    icon: Sparkles,
    description: 'Une entité millénaire s\'éveille de son sommeil',
    mood: 'Apocalyptique',
    createSound: (audioContext: AudioContext, volume: number) => {
      const rumble = audioContext.createOscillator();
      const rumbleGain = audioContext.createGain();
      const rumbleFilter = audioContext.createBiquadFilter();
      
      rumble.type = 'sawtooth';
      rumble.frequency.value = 25;
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 50;
      
      const screech = audioContext.createOscillator();
      const screechGain = audioContext.createGain();
      const screechFilter = audioContext.createBiquadFilter();
      const screechLFO = audioContext.createOscillator();
      const screechLFOGain = audioContext.createGain();
      
      screech.type = 'square';
      screech.frequency.value = 1000;
      
      screechFilter.type = 'bandpass';
      screechFilter.frequency.value = 2000;
      screechFilter.Q.value = 5;
      
      screechLFO.type = 'sine';
      screechLFO.frequency.value = 10;
      screechLFOGain.gain.value = 500;
      
      screechLFO.connect(screechLFOGain);
      screechLFOGain.connect(screech.frequency);
      
      const now = audioContext.currentTime;
      rumbleGain.gain.setValueAtTime(0, now);
      rumbleGain.gain.linearRampToValueAtTime(volume * 0.15, now + 5);
      
      screechGain.gain.setValueAtTime(0, now);
      screechGain.gain.linearRampToValueAtTime(volume * 0.05, now + 3);
      
      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(audioContext.destination);
      
      screech.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(audioContext.destination);
      
      rumble.start();
      screech.start();
      screechLFO.start();
      
      return () => {
        rumble.stop();
        screech.stop();
        screechLFO.stop();
        rumble.disconnect();
        screech.disconnect();
        screechLFO.disconnect();
        rumbleFilter.disconnect();
        screechFilter.disconnect();
        rumbleGain.disconnect();
        screechGain.disconnect();
        screechLFOGain.disconnect();
      };
    }
  },
  {
    id: 'madness-onset',
    name: 'Montée de la Folie',
    category: 'event',
    icon: Brain,
    description: 'L\'esprit vacille face à l\'inconcevable',
    mood: 'Chaotique',
    createSound: (audioContext: AudioContext, volume: number) => {
      const voices: any[] = [];
      
      // Multiple detuned oscillators for disorientation
      for (let i = 0; i < 5; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const pan = audioContext.createStereoPanner();
        
        osc.type = 'sine';
        osc.frequency.value = 200 + i * 111; // Dissonant intervals
        osc.detune.value = Math.random() * 50 - 25;
        
        pan.pan.value = Math.random() * 2 - 1; // Random stereo position
        
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = Math.random() * 5;
        lfoGain.gain.value = 20;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(audioContext.destination);
        
        gain.gain.value = volume * 0.03;
        
        osc.start();
        lfo.start();
        
        voices.push({ osc, gain, pan, lfo, lfoGain });
      }
      
      return () => {
        voices.forEach(({ osc, gain, pan, lfo, lfoGain }) => {
          osc.stop();
          lfo.stop();
          osc.disconnect();
          gain.disconnect();
          pan.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
        });
      };
    }
  },
  {
    id: 'portal-opening',
    name: 'Ouverture du Portail',
    category: 'event',
    icon: Sparkles,
    description: 'Déchirure dans le tissu de la réalité',
    mood: 'Surnaturel',
    createSound: (audioContext: AudioContext, volume: number) => {
      const rip = audioContext.createOscillator();
      const ripGain = audioContext.createGain();
      const ripFilter = audioContext.createBiquadFilter();
      
      rip.type = 'sawtooth';
      rip.frequency.value = 50;
      
      ripFilter.type = 'bandpass';
      ripFilter.frequency.value = 500;
      ripFilter.Q.value = 1;
      
      // Sweeping effect
      const now = audioContext.currentTime;
      rip.frequency.setValueAtTime(50, now);
      rip.frequency.exponentialRampToValueAtTime(2000, now + 2);
      rip.frequency.exponentialRampToValueAtTime(100, now + 4);
      
      ripFilter.frequency.setValueAtTime(100, now);
      ripFilter.frequency.exponentialRampToValueAtTime(5000, now + 2);
      ripFilter.frequency.exponentialRampToValueAtTime(200, now + 4);
      
      // Dimensional echo
      const delay = audioContext.createDelay(2);
      const feedback = audioContext.createGain();
      delay.delayTime.value = 0.5;
      feedback.gain.value = 0.6;
      
      rip.connect(ripFilter);
      ripFilter.connect(ripGain);
      ripGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(audioContext.destination);
      ripGain.connect(audioContext.destination);
      
      ripGain.gain.value = volume * 0.1;
      
      rip.start();
      
      return () => {
        rip.stop();
        rip.disconnect();
        ripFilter.disconnect();
        ripGain.disconnect();
        delay.disconnect();
        feedback.disconnect();
      };
    }
  },
  {
    id: 'combat-tension',
    name: 'Combat Imminent',
    category: 'event',
    icon: Zap,
    description: 'Tension montante avant l\'affrontement',
    mood: 'Agressif',
    createSound: (audioContext: AudioContext, volume: number) => {
      // War drums
      const drum = audioContext.createOscillator();
      const drumGain = audioContext.createGain();
      const drumFilter = audioContext.createBiquadFilter();
      
      drum.type = 'sine';
      drum.frequency.value = 60;
      drumFilter.type = 'lowpass';
      drumFilter.frequency.value = 200;
      
      const drumHit = () => {
        const now = audioContext.currentTime;
        drumGain.gain.cancelScheduledValues(now);
        drumGain.gain.setValueAtTime(0, now);
        drumGain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.01);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      };
      
      // Metal clanging
      const clang = () => {
        const metal = audioContext.createOscillator();
        const metalGain = audioContext.createGain();
        const metalFilter = audioContext.createBiquadFilter();
        
        metal.type = 'square';
        metal.frequency.value = 800 + Math.random() * 400;
        metalFilter.type = 'highpass';
        metalFilter.frequency.value = 1000;
        
        const now = audioContext.currentTime;
        metalGain.gain.setValueAtTime(volume * 0.05, now);
        metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        metal.connect(metalFilter);
        metalFilter.connect(metalGain);
        metalGain.connect(audioContext.destination);
        
        metal.start(now);
        metal.stop(now + 0.5);
      };
      
      drum.connect(drumFilter);
      drumFilter.connect(drumGain);
      drumGain.connect(audioContext.destination);
      
      drum.start();
      
      const drumInterval = setInterval(drumHit, 500);
      const clangInterval = setInterval(() => {
        if (Math.random() > 0.6) clang();
      }, 2000);
      
      return () => {
        clearInterval(drumInterval);
        clearInterval(clangInterval);
        drum.stop();
        drum.disconnect();
        drumFilter.disconnect();
        drumGain.disconnect();
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

  const allSounds = [...ATMOSPHERIC_SOUNDS, ...LOCATION_SOUNDS, ...EVENT_SOUNDS];
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