import { world, system, Player, ItemStack, EntityInventoryComponent } from '@minecraft/server';

const POLL_INTERVAL_TICKS = 4;
const lastTypeIdByPlayer = new Map<string, string | undefined>();

export type HeldItemChangeCallback = (player: Player, itemStack: ItemStack | undefined) => void;

export function startHeldItemTracking(onChange: HeldItemChangeCallback): void {
  // O player não fica mais válido após sair; guardamos só o playerId no evento de leave.
  world.afterEvents.playerLeave.subscribe((event) => {
    lastTypeIdByPlayer.delete(event.playerId);
  });

  system.runInterval(() => {
    for (const player of world.getPlayers()) {
      const inventory = player.getComponent('minecraft:inventory') as EntityInventoryComponent | undefined;
      if (!inventory?.container) continue;

      const itemStack = inventory.container.getItem(player.selectedSlotIndex);
      const typeId = itemStack?.typeId;

      if (typeId !== lastTypeIdByPlayer.get(player.id)) {
        lastTypeIdByPlayer.set(player.id, typeId);
        onChange(player, itemStack);
      }
    }
  }, POLL_INTERVAL_TICKS);
}
