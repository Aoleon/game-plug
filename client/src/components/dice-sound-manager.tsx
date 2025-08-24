import { createContext, useContext, useRef, ReactNode } from "react";

interface DiceSoundContextType {
  playRoll: () => void;
  playSuccess: () => void;
  playFailure: () => void;
  playCritical: () => void;
  playFumble: () => void;
  playAmbient: (type?: 'cave' | 'whispers' | 'heartbeat') => void;
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

  const playAmbient = (type: 'cave' | 'whispers' | 'heartbeat' = 'cave') => {
    const ctx = initAudio();
    if (!ctx) return;

    // Stop any existing ambient sound
    stopAmbient();

    ambientOscillator.current = ctx.createOscillator();
    ambientGain.current = ctx.createGain();
    
    // Create filters for atmosphere
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    
    switch (type) {
      case 'cave':
        // Deep cave ambiance
        ambientOscillator.current.type = 'triangle';
        ambientOscillator.current.frequency.setValueAtTime(40, ctx.currentTime);
        
        // Add reverb-like modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
        lfoGain.gain.setValueAtTime(5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(ambientOscillator.current.frequency);
        lfo.start();
        
        ambientGain.current.gain.setValueAtTime(0.15, ctx.currentTime); // Audible volume
        break;
        
      case 'whispers':
        // Eldritch whispers
        ambientOscillator.current.type = 'sawtooth';
        ambientOscillator.current.frequency.setValueAtTime(800, ctx.currentTime);
        
        // Rapid frequency modulation for whisper effect
        const whisperLfo = ctx.createOscillator();
        const whisperGain = ctx.createGain();
        whisperLfo.frequency.setValueAtTime(8, ctx.currentTime);
        whisperGain.gain.setValueAtTime(200, ctx.currentTime);
        whisperLfo.connect(whisperGain);
        whisperGain.connect(ambientOscillator.current.frequency);
        whisperLfo.start();
        
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        ambientGain.current.gain.setValueAtTime(0.08, ctx.currentTime);
        break;
        
      case 'heartbeat':
        // Ominous heartbeat
        ambientOscillator.current.type = 'sine';
        ambientOscillator.current.frequency.setValueAtTime(50, ctx.currentTime);
        
        // Create heartbeat rhythm
        const now = ctx.currentTime;
        ambientGain.current.gain.setValueAtTime(0, now);
        
        // Heartbeat pattern
        for (let i = 0; i < 100; i++) {
          const beatTime = now + i * 0.8;
          ambientGain.current.gain.setValueAtTime(0, beatTime);
          ambientGain.current.gain.linearRampToValueAtTime(0.2, beatTime + 0.1);
          ambientGain.current.gain.linearRampToValueAtTime(0, beatTime + 0.2);
          ambientGain.current.gain.setValueAtTime(0, beatTime + 0.3);
          ambientGain.current.gain.linearRampToValueAtTime(0.15, beatTime + 0.35);
          ambientGain.current.gain.linearRampToValueAtTime(0, beatTime + 0.45);
        }
        break;
    }
    
    ambientOscillator.current.connect(filter);
    filter.connect(ambientGain.current);
    ambientGain.current.connect(ctx.destination);
    
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