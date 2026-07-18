import type { PetSpeciesId, ShopCategoryId } from "./pets";

export type CompanionPetView = {
  id: string;
  speciesId: PetSpeciesId;
  speciesTitle: string;
  eggTitle: string;
  tagline: string;
  personalityId: string;
  personalityTitle: string;
  name: string | null;
  petXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  stage: string;
  happiness: number;
  happinessState: string;
  dialogue: string;
  awayDays: number;
  colors: { primary: string; secondary: string; accent: string };
  canPetToday: boolean;
  lastPetDate: string | null;
};

export type CompanionGiftView = {
  id: string;
  giftKind: string;
  coins: number;
  itemId: string | null;
  claimed: boolean;
  message: string;
} | null;

export type CompanionSnapshot = {
  needsStarter: boolean;
  starters: Array<{
    id: PetSpeciesId;
    title: string;
    eggTitle: string;
    tagline: string;
    colors: { primary: string; secondary: string; accent: string };
  }>;
  accountXp: number;
  accountLevel: number;
  accountXpIntoLevel: number;
  accountXpForNext: number;
  unlockedCategories: ShopCategoryId[];
  pet: CompanionPetView | null;
  gift: CompanionGiftView;
  garden: {
    cols: number;
    rows: number;
    cells: number;
    placements: Array<{
      id: string;
      itemId: string;
      title: string;
      cellIndex: number;
    }>;
    inventoryDecor: Array<{ itemId: string; title: string; qty: number }>;
  };
  foodInventory: Array<{ itemId: string; title: string; qty: number }>;
};
