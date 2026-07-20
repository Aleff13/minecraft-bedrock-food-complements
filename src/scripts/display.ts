import { Player, ItemStack } from '@minecraft/server';
import { FoodInfo } from './foodData';

export function updateActionBar(
  player: Player,
  itemStack: ItemStack | undefined,
  foodInfo: FoodInfo | undefined
): void {
  if (!itemStack || !foodInfo) {
    player.onScreenDisplay.setActionBar('');
    return;
  }

  const saturationText = foodInfo.saturation.toFixed(1);
  player.onScreenDisplay.setActionBar(`Fome +${foodInfo.nutrition} | Saturação +${saturationText}`);
}
