import { ItemStack } from '@minecraft/server';
import rawVanillaFoodData from '../../data/vanilla-food-data.json';

export interface FoodInfo {
  nutrition: number;
  saturation: number;
  name: string;
}

interface VanillaFoodEntry {
  id: string;
  namePt: string;
  nutrition: number;
  saturation: number;
}

const VANILLA_FOOD_BY_ID: ReadonlyMap<string, FoodInfo> = new Map(
  (rawVanillaFoodData as VanillaFoodEntry[]).map((entry) => [
    entry.id,
    { nutrition: entry.nutrition, saturation: entry.saturation, name: entry.namePt },
  ])
);

export function getFoodInfo(itemStack: ItemStack): FoodInfo | undefined {
  const vanillaInfo = VANILLA_FOOD_BY_ID.get(itemStack.typeId);
  if (vanillaInfo) {
    return vanillaInfo;
  }

  // Cobre itens de comida data-driven de outros add-ons instalados junto,
  // já que o componente "minecraft:food" não existe para itens vanilla.
  const foodComponent = itemStack.getComponent('minecraft:food');
  if (!foodComponent) {
    return undefined;
  }

  return {
    nutrition: foodComponent.nutrition,
    saturation: foodComponent.nutrition * foodComponent.saturationModifier * 2,
    name: itemStack.typeId,
  };
}
