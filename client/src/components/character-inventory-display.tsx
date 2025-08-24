import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Sword, Shield, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  characterId: string;
  name: string;
  description?: string | null;
  category: string;
  quantity: number;
  weight: number;
  isEquipped: boolean;
  damage?: string | null;
  armor?: number | null;
}

interface CharacterInventoryDisplayProps {
  characterId: string | null;
  onRemoveItem?: (itemId: string) => void;
}

export default function CharacterInventoryDisplay({ 
  characterId, 
  onRemoveItem 
}: CharacterInventoryDisplayProps) {
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/characters", characterId, "inventory"],
    enabled: !!characterId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-aged-parchment text-center py-4">
        Chargement de l'inventaire...
      </div>
    );
  }

  if (!characterId) {
    return null;
  }

  if (inventory.length === 0) {
    return (
      <div className="text-aged-parchment text-center py-4 bg-cosmic-void/50 rounded border border-aged-gold/30">
        L'inventaire est vide
      </div>
    );
  }

  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  return (
    <div className="space-y-2">
      <div className="text-sm text-aged-parchment mb-2">
        Poids total: {totalWeight} slots
      </div>
      
      {inventory.map((item) => (
        <div 
          key={item.id} 
          className="bg-cosmic-void border border-aged-gold/50 rounded p-2 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {item.category === 'weapon' && <Sword className="h-3 w-3 text-aged-gold" />}
              {item.category === 'armor' && <Shield className="h-3 w-3 text-aged-gold" />}
              {item.category === 'tool' && <Package className="h-3 w-3 text-aged-gold" />}
              <span className="text-bone-white text-sm font-semibold">{item.name}</span>
              {item.quantity > 1 && <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>}
              {item.isEquipped && <Badge className="bg-eldritch-green text-xs">Équipé</Badge>}
            </div>
            {item.description && (
              <p className="text-aged-parchment text-xs mt-1">{item.description}</p>
            )}
            <div className="flex gap-3 mt-1 text-xs text-aged-parchment">
              <span>Poids: {item.weight * item.quantity}</span>
              {item.damage && <span>Dégâts: {item.damage}</span>}
              {item.armor && <span>Armure: +{item.armor}</span>}
            </div>
          </div>
          {onRemoveItem && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveItem(item.id)}
              className="text-blood-burgundy hover:bg-blood-burgundy/20 p-1"
              data-testid={`button-remove-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}