import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, Brain, Shield, Sparkles, Clock,
  Activity, Zap, Pill, Smile, TrendingUp,
  AlertTriangle, Skull, Moon, Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveEffect } from "@shared/schema";

interface ActiveBuffsDisplayProps {
  effects: ActiveEffect[];
  className?: string;
}

export default function ActiveBuffsDisplay({ effects, className }: ActiveBuffsDisplayProps) {
  // Separate buffs and debuffs
  const buffs = effects.filter(e => e.type === 'buff');
  const debuffs = effects.filter(e => e.type === 'debuff');
  const otherEffects = effects.filter(e => e.type !== 'buff' && e.type !== 'debuff');
  
  const getEffectIcon = (effect: ActiveEffect) => {
    const name = effect.name?.toLowerCase() || '';
    
    // Buffs
    if (name.includes('soin') || name.includes('heal') || name.includes('pv')) {
      return <Heart className="h-4 w-4 text-green-500" />;
    }
    if (name.includes('sanité') || name.includes('sanity') || name.includes('thérapie')) {
      return <Brain className="h-4 w-4 text-purple-500" />;
    }
    if (name.includes('magie') || name.includes('magic')) {
      return <Sparkles className="h-4 w-4 text-cyan-500" />;
    }
    if (name.includes('chance') || name.includes('luck') || name.includes('bénédiction')) {
      return <Shield className="h-4 w-4 text-yellow-500" />;
    }
    if (name.includes('compétence') || name.includes('skill') || name.includes('inspiration')) {
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    }
    if (name.includes('repos')) {
      return <Moon className="h-4 w-4 text-indigo-500" />;
    }
    if (name.includes('médicament') || name.includes('medication')) {
      return <Pill className="h-4 w-4 text-blue-500" />;
    }
    
    // Debuffs
    if (name.includes('blessure') || name.includes('wound')) {
      return <Activity className="h-4 w-4 text-red-500" />;
    }
    if (name.includes('folie') || name.includes('madness') || name.includes('insanity')) {
      return <AlertTriangle className="h-4 w-4 text-purple-700" />;
    }
    if (name.includes('mort') || name.includes('death') || name.includes('mourant')) {
      return <Skull className="h-4 w-4 text-red-700" />;
    }
    if (name.includes('malédiction') || name.includes('curse')) {
      return <AlertTriangle className="h-4 w-4 text-blood-burgundy" />;
    }
    
    // Default
    if (effect.type === 'buff') {
      return <Zap className="h-4 w-4 text-green-400" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-400" />;
  };
  
  const getEffectColor = (effect: ActiveEffect) => {
    if (effect.type === 'buff') {
      const name = effect.name?.toLowerCase() || '';
      if (name.includes('soin') || name.includes('heal')) return 'bg-green-500/20 border-green-500';
      if (name.includes('sanité') || name.includes('sanity')) return 'bg-purple-500/20 border-purple-500';
      if (name.includes('magie') || name.includes('magic')) return 'bg-cyan-500/20 border-cyan-500';
      if (name.includes('chance') || name.includes('luck')) return 'bg-yellow-500/20 border-yellow-500';
      if (name.includes('compétence') || name.includes('skill')) return 'bg-orange-500/20 border-orange-500';
      return 'bg-eldritch-green/20 border-eldritch-green';
    }
    
    if (effect.type === 'debuff') {
      const name = effect.name?.toLowerCase() || '';
      if (name.includes('mort') || name.includes('mourant')) return 'bg-red-900/40 border-red-700';
      if (name.includes('folie')) return 'bg-purple-900/40 border-purple-700';
      return 'bg-blood-burgundy/20 border-blood-burgundy';
    }
    
    return 'bg-cosmic-void border-aged-gold/50';
  };
  
  const formatDuration = (duration?: number | null) => {
    if (!duration) return null;
    if (duration < 60) return `${duration}m`;
    if (duration < 1440) return `${Math.floor(duration / 60)}h`;
    return `${Math.floor(duration / 1440)}j`;
  };
  
  if (effects.length === 0) {
    return null;
  }
  
  return (
    <Card className={cn("bg-charcoal border-aged-gold parchment-bg", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-aged-gold text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Effets Actifs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {/* Buffs */}
            {buffs.length > 0 && (
              <div>
                <h4 className="text-sm font-source text-eldritch-green mb-2">Buffs Actifs</h4>
                <div className="space-y-2">
                  {buffs.map((buff) => (
                    <div
                      key={buff.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all hover:scale-[1.02]",
                        getEffectColor(buff)
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {getEffectIcon(buff)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-source text-bone-white font-medium">
                              {buff.name}
                            </span>
                            {buff.value && (
                              <Badge variant="outline" className="text-xs bg-black/30">
                                +{buff.value}
                              </Badge>
                            )}
                            {buff.duration && buff.duration > 0 && (
                              <Badge variant="outline" className="text-xs bg-black/30">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(buff.duration)}
                              </Badge>
                            )}
                          </div>
                          {buff.description && (
                            <p className="text-xs text-aged-parchment mt-1 pr-2">
                              {buff.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Duration progress bar for timed buffs */}
                      {buff.duration && buff.duration > 0 && (
                        <div className="mt-2">
                          <Progress 
                            value={75} // Would need to calculate based on time passed
                            className="h-1 bg-black/30"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Debuffs */}
            {debuffs.length > 0 && (
              <div>
                <h4 className="text-sm font-source text-blood-burgundy mb-2">Afflictions</h4>
                <div className="space-y-2">
                  {debuffs.map((debuff) => (
                    <div
                      key={debuff.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all hover:scale-[1.02]",
                        getEffectColor(debuff)
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {getEffectIcon(debuff)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-source text-bone-white font-medium">
                              {debuff.name}
                            </span>
                            {debuff.value && (
                              <Badge variant="outline" className="text-xs bg-black/30 text-red-400">
                                {debuff.value}
                              </Badge>
                            )}
                            {debuff.duration && debuff.duration > 0 && (
                              <Badge variant="outline" className="text-xs bg-black/30">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(debuff.duration)}
                              </Badge>
                            )}
                          </div>
                          {debuff.description && (
                            <p className="text-xs text-aged-parchment mt-1 pr-2">
                              {debuff.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Effects */}
            {otherEffects.length > 0 && (
              <div>
                <h4 className="text-sm font-source text-aged-gold mb-2">Autres Effets</h4>
                <div className="space-y-2">
                  {otherEffects.map((effect) => (
                    <div
                      key={effect.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        getEffectColor(effect)
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {getEffectIcon(effect)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-source text-bone-white font-medium">
                              {effect.name}
                            </span>
                            {effect.value && (
                              <Badge variant="outline" className="text-xs">
                                {effect.value}
                              </Badge>
                            )}
                          </div>
                          {effect.description && (
                            <p className="text-xs text-aged-parchment mt-1">
                              {effect.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}