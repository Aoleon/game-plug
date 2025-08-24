import { createContext, useContext, useRef, ReactNode } from "react";

interface DiceSoundContextType {
  playRoll: () => void;
  playSuccess: () => void;
  playFailure: () => void;
  playCritical: () => void;
  playFumble: () => void;
  playAmbient: () => void;
  stopAmbient: () => void;
}

const DiceSoundContext = createContext<DiceSoundContextType | undefined>(undefined);

export function DiceSoundProvider({ children }: { children: ReactNode }) {
  const audioContext = useRef<AudioContext | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const ambientOscillator = useRef<OscillatorNode | null>(null);

  const initAudio = () => {
    if (!audioContext.current && typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  };

  const playRoll = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Multiple quick clicks to simulate dice rolling
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);
    
    for (let i = 0; i < 5; i++) {
      oscillator.frequency.setValueAtTime(Math.random() * 400 + 600, now + i * 0.05);
    }
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  };

  const playSuccess = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Ascending ethereal tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  };

  const playFailure = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Descending ominous drone
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    
    oscillator.start(now);
    oscillator.stop(now + 0.7);
  };

  const playCritical = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Mysterious whisper with vibrato
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1200, now);
    
    // Create LFO for vibrato effect
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(6, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(100, now);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start(now);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
    
    oscillator.start(now);
    oscillator.stop(now + 1);
    lfo.stop(now + 1);
  };

  const playFumble = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Create distortion for horror effect
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      curve[i] = Math.sin(i * 0.05) * 0.5;
    }
    distortion.curve = curve;
    
    oscillator.connect(distortion);
    distortion.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Eldritch scream
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  };

  const playAmbient = () => {
    const ctx = initAudio();
    if (!ctx) return;

    // Stop any existing ambient sound
    stopAmbient();

    ambientOscillator.current = ctx.createOscillator();
    ambientGain.current = ctx.createGain();
    
    // Create a low-frequency oscillator for modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // Very slow modulation
    lfoGain.gain.setValueAtTime(20, ctx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(ambientOscillator.current.frequency);
    
    ambientOscillator.current.type = 'sine';
    ambientOscillator.current.frequency.setValueAtTime(60, ctx.currentTime); // Deep bass
    
    ambientOscillator.current.connect(ambientGain.current);
    ambientGain.current.connect(ctx.destination);
    
    ambientGain.current.gain.setValueAtTime(0.05, ctx.currentTime); // Very quiet
    
    lfo.start();
    ambientOscillator.current.start();
  };

  const stopAmbient = () => {
    if (ambientOscillator.current) {
      ambientOscillator.current.stop();
      ambientOscillator.current = null;
    }
    if (ambientGain.current) {
      ambientGain.current.disconnect();
      ambientGain.current = null;
    }
  };

  return (
    <DiceSoundContext.Provider value={{
      playRoll,
      playSuccess,
      playFailure,
      playCritical,
      playFumble,
      playAmbient,
      stopAmbient
    }}>
      {children}
    </DiceSoundContext.Provider>
  );
}

export function useDiceSound() {
  const context = useContext(DiceSoundContext);
  if (!context) {
    // Return no-op functions if context is not available
    return {
      playRoll: () => {},
      playSuccess: () => {},
      playFailure: () => {},
      playCritical: () => {},
      playFumble: () => {},
      playAmbient: () => {},
      stopAmbient: () => {}
    };
  }
  return context;
}