import { useEffect, useRef } from "react";

// Sons de dés simulés (en production, utiliser de vrais fichiers audio)
const DICE_SOUNDS = {
  roll: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
  success: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
  critical: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
  fumble: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
};

export class DiceSoundManager {
  private static instance: DiceSoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {
    this.initializeSounds();
  }

  static getInstance(): DiceSoundManager {
    if (!DiceSoundManager.instance) {
      DiceSoundManager.instance = new DiceSoundManager();
    }
    return DiceSoundManager.instance;
  }

  private initializeSounds() {
    Object.entries(DICE_SOUNDS).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.volume = this.volume;
      this.sounds.set(key, audio);
    });
  }

  playSound(soundName: keyof typeof DICE_SOUNDS) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.log("Audio playback failed:", err);
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  playRollSound() {
    this.playSound("roll");
  }

  playSuccessSound() {
    this.playSound("success");
  }

  playCriticalSound() {
    this.playSound("critical");
  }

  playFumbleSound() {
    this.playSound("fumble");
  }
}

export function useDiceSound() {
  const managerRef = useRef(DiceSoundManager.getInstance());

  return {
    playRoll: () => managerRef.current.playRollSound(),
    playSuccess: () => managerRef.current.playSuccessSound(),
    playCritical: () => managerRef.current.playCriticalSound(),
    playFumble: () => managerRef.current.playFumbleSound(),
    setEnabled: (enabled: boolean) => managerRef.current.setEnabled(enabled),
    setVolume: (volume: number) => managerRef.current.setVolume(volume),
  };
}