import { startHeldItemTracking } from './heldItemTracker';
import { getFoodInfo } from './foodData';
import { updateActionBar } from './display';

startHeldItemTracking((player, itemStack) => {
  const foodInfo = itemStack ? getFoodInfo(itemStack) : undefined;
  updateActionBar(player, itemStack, foodInfo);
});
