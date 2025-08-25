import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Package, Search, Plus, Minus, Trash2, 
  Sword, Shield, Coins, DollarSign, 
  Heart, Sparkles, Book, Wrench
} from "lucide-react";
import type { Character, InventoryItem } from "@shared/schema";

interface CharacterInventoryManagerProps {
  characterId: string;
  isGM?: boolean;
}

// Liste d'objets Call of Cthulhu typiques
const EQUIPMENT_CATALOG = {
  weapons: [
    { name: "Revolver .38", category: "weapon", damage: "1d10", weight: 1, basePrice: 25 },
    { name: "Revolver .45", category: "weapon", damage: "1d10+2", weight: 1, basePrice: 30 },
    { name: "Fusil de chasse", category: "weapon", damage: "4d6/2d6/1d6", weight: 3, basePrice: 35 },
    { name: "Matraque", category: "weapon", damage: "1d6", weight: 1, basePrice: 5 },
    { name: "Couteau", category: "weapon", damage: "1d4", weight: 0.5, basePrice: 2 },
    { name: "Épée canne", category: "weapon", damage: "1d6", weight: 1, basePrice: 15 },
    { name: "Fusil à éléphant", category: "weapon", damage: "3d6+4", weight: 4, basePrice: 400 },
    { name: "Pistolet automatique", category: "weapon", damage: "1d10", weight: 1, basePrice: 40 },
    { name: "Mitraillette Thompson", category: "weapon", damage: "1d10+2", weight: 4, basePrice: 200 }
  ],
  armor: [
    { name: "Gilet en cuir épais", category: "armor", armor: 1, weight: 2, basePrice: 10 },
    { name: "Casque militaire", category: "armor", armor: 2, weight: 1, basePrice: 15 },
    { name: "Manteau renforcé", category: "armor", armor: 1, weight: 3, basePrice: 20 }
  ],
  tools: [
    { name: "Lampe torche", category: "tool", weight: 1, basePrice: 2 },
    { name: "Lanterne", category: "tool", weight: 1, basePrice: 3 },
    { name: "Corde (15m)", category: "tool", weight: 2, basePrice: 1 },
    { name: "Pied de biche", category: "tool", weight: 2, basePrice: 3 },
    { name: "Trousse de premiers soins", category: "tool", weight: 1, basePrice: 5 },
    { name: "Jumelles", category: "tool", weight: 1, basePrice: 10 },
    { name: "Appareil photo", category: "tool", weight: 2, basePrice: 15 },
    { name: "Kit de crochetage", category: "tool", weight: 0.5, basePrice: 15 },
    { name: "Briquet", category: "tool", weight: 0.1, basePrice: 0.5 },
    { name: "Montre de poche", category: "tool", weight: 0.1, basePrice: 5 },
    { name: "Carte de la région", category: "tool", weight: 0.1, basePrice: 1 },
    { name: "Boussole", category: "tool", weight: 0.2, basePrice: 3 }
  ],
  consumables: [
    { name: "Munitions .38 (x6)", category: "consumable", weight: 0.1, basePrice: 1 },
    { name: "Munitions .45 (x6)", category: "consumable", weight: 0.1, basePrice: 1.5 },
    { name: "Cartouches de fusil (x5)", category: "consumable", weight: 0.2, basePrice: 1 },
    { name: "Dynamite", category: "consumable", damage: "4d10", weight: 0.5, basePrice: 5 },
    { name: "Flasque de whisky", category: "consumable", weight: 0.5, basePrice: 2 },
    { name: "Morphine", category: "consumable", weight: 0.1, basePrice: 10 },
    { name: "Bandages", category: "consumable", weight: 0.2, basePrice: 0.5 }
  ],
  books: [
    { name: "Bible", category: "book", weight: 1, basePrice: 2 },
    { name: "Journal intime", category: "book", weight: 0.5, basePrice: 1 },
    { name: "Carnet de notes", category: "book", weight: 0.3, basePrice: 0.5 },
    { name: "Encyclopédie", category: "book", weight: 3, basePrice: 10 },
    { name: "Livre occulte", category: "book", weight: 1, basePrice: 50 },
    { name: "Necronomicon (fragment)", category: "book", weight: 2, basePrice: 500 }
  ]
};

export default function CharacterInventoryManager({ characterId, isGM = false }: CharacterInventoryManagerProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyOperation, setMoneyOperation] = useState<"add" | "remove">("add");

  // Fetch character data including money
  const { data: character } = useQuery<Character>({
    queryKey: ["/api/characters", characterId],
    enabled: !!characterId,
  });

  // Fetch inventory
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/characters", characterId, "inventory"],
    enabled: !!characterId,
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/inventory`, item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
      toast({
        title: "Objet ajouté",
        description: "L'objet a été ajouté à l'inventaire.",
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/characters/${characterId}/inventory/${itemId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
      toast({
        title: "Objet retiré",
        description: "L'objet a été retiré de l'inventaire.",
      });
    },
  });

  // Update item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/characters/${characterId}/inventory/${itemId}`, {
        quantity
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
    },
  });

  // Update money mutation
  const updateMoneyMutation = useMutation({
    mutationFn: async (newAmount: number) => {
      const response = await apiRequest("PATCH", `/api/characters/${characterId}`, {
        money: newAmount
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      toast({
        title: "Argent mis à jour",
        description: "Le montant d'argent a été modifié.",
      });
    },
  });

  const handleMoneyChange = () => {
    if (!moneyAmount || !character) return;
    
    const amount = parseFloat(moneyAmount);
    if (isNaN(amount)) return;
    
    const currentMoney = typeof character.money === 'string' ? parseFloat(character.money) : (character.money || 0);
    const newAmount = moneyOperation === "add" 
      ? currentMoney + amount 
      : Math.max(0, currentMoney - amount);
    
    updateMoneyMutation.mutate(newAmount);
    setMoneyAmount("");
  };

  const handleAddItem = (item: any) => {
    addItemMutation.mutate({
      name: item.name,
      category: item.category,
      damage: item.damage || null,
      armor: item.armor || null,
      weight: item.weight,
      quantity: 1,
      isEquipped: false,
      description: item.description || null
    });
  };

  const handleQuantityChange = (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    if (newQuantity === 0) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  // Filter equipment based on search and category
  const allEquipment: any[] = [
    ...EQUIPMENT_CATALOG.weapons,
    ...EQUIPMENT_CATALOG.armor,
    ...EQUIPMENT_CATALOG.tools,
    ...EQUIPMENT_CATALOG.consumables,
    ...EQUIPMENT_CATALOG.books
  ];

  const filteredEquipment = allEquipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalWeight = inventory.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 0)), 0);
  const currentMoney = character?.money ? (typeof character.money === 'string' ? parseFloat(character.money) : character.money) : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "weapon": return <Sword className="h-3 w-3" />;
      case "armor": return <Shield className="h-3 w-3" />;
      case "tool": return <Wrench className="h-3 w-3" />;
      case "consumable": return <Heart className="h-3 w-3" />;
      case "book": return <Book className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return <div className="text-aged-parchment text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Money Management */}
      <Card className="bg-cosmic-void border-aged-gold/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-cinzel text-aged-gold flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Gestion de l'Argent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-bone-white font-bold text-lg">
              ${currentMoney.toFixed(2)}
            </div>
            {isGM && (
              <>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <div className="flex gap-1 flex-1">
                  <Button
                    size="sm"
                    variant={moneyOperation === "add" ? "default" : "outline"}
                    onClick={() => setMoneyOperation("add")}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={moneyOperation === "remove" ? "default" : "outline"}
                    onClick={() => setMoneyOperation("remove")}
                    className="h-7 px-2"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Montant"
                    value={moneyAmount}
                    onChange={(e) => setMoneyAmount(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleMoneyChange}
                    disabled={!moneyAmount}
                    className="h-7 px-3 bg-eldritch-green hover:bg-green-700"
                  >
                    <DollarSign className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cosmic-void">
          <TabsTrigger value="inventory">
            Inventaire ({inventory.length} objets, {totalWeight.toFixed(1)} slots)
          </TabsTrigger>
          {isGM && (
            <TabsTrigger value="catalog">
              Ajouter des Objets
            </TabsTrigger>
          )}
        </TabsList>

        {/* Current Inventory Tab */}
        <TabsContent value="inventory" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {inventory.length === 0 ? (
                <div className="text-aged-parchment text-center py-8 bg-cosmic-void/50 rounded border border-aged-gold/30">
                  L'inventaire est vide
                </div>
              ) : (
                inventory.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-cosmic-void border border-aged-gold/50 rounded p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span className="text-bone-white text-sm font-semibold">{item.name}</span>
                        {(item.quantity || 0) > 1 && (
                          <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>
                        )}
                        {item.isEquipped && (
                          <Badge className="bg-eldritch-green text-xs">Équipé</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-aged-parchment text-xs mt-1">{item.description}</p>
                      )}
                      <div className="flex gap-3 mt-1 text-xs text-aged-parchment">
                        <span>Poids: {((item.weight || 0) * (item.quantity || 0)).toFixed(1)}</span>
                        {item.damage && <span>Dégâts: {item.damage}</span>}
                        {item.armor && <span>Armure: +{item.armor}</span>}
                      </div>
                    </div>
                    {isGM && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuantityChange(item.id, item.quantity || 0, -1)}
                          className="h-7 w-7 p-0 text-aged-gold hover:bg-cosmic-void"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-bone-white text-sm w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuantityChange(item.id, item.quantity || 0, 1)}
                          className="h-7 w-7 p-0 text-aged-gold hover:bg-cosmic-void"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="h-7 w-7 p-0 text-blood-burgundy hover:bg-blood-burgundy/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Equipment Catalog Tab (GM only) */}
        {isGM && (
          <TabsContent value="catalog" className="mt-4">
            <div className="space-y-3">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-aged-parchment" />
                  <Input
                    placeholder="Rechercher un objet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-cosmic-void border-aged-gold/50"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-cosmic-void border border-aged-gold/50 rounded text-aged-parchment text-sm"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="weapon">Armes</option>
                  <option value="armor">Armures</option>
                  <option value="tool">Outils</option>
                  <option value="consumable">Consommables</option>
                  <option value="book">Livres</option>
                </select>
              </div>

              {/* Equipment List */}
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredEquipment.map((item, index) => (
                    <div 
                      key={`${item.category}-${index}`}
                      className="bg-cosmic-void border border-aged-gold/30 rounded p-3 flex items-center justify-between hover:border-aged-gold/60 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="text-bone-white text-sm">{item.name}</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-aged-parchment">
                          <span>Poids: {item.weight}</span>
                          {item.damage && <span>Dégâts: {item.damage}</span>}
                          {item.armor && <span>Armure: +{item.armor}</span>}
                          {item.basePrice && <span>${item.basePrice}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        className="h-7 px-3 bg-eldritch-green hover:bg-green-700 text-bone-white"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Ajouter
                      </Button>
                    </div>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <div className="text-aged-parchment text-center py-8">
                      Aucun objet trouvé
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}