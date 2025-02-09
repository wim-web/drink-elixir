import { generateField, type Field, type Position } from "~/pkg/dungeon/field";
import type { ItemNames } from "~/pkg/dungeon/item";
import { playerMaxHitPoint, type Enemy, type Player } from "~/pkg/dungeon/piece";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

export type DungeonMap = {
    field: Field,
    stairPos: Position,
    player: Player & { pos: Position },
    enemy: Enemy & { pos: Position },
}

export function generateMap({ player }: {
    player?: { hitPoint: number, inventory: Map<string, number> }
}): DungeonMap {
    const { field, stairPos, playerPos, enemyPos } = generateField(GRID_WIDTH, GRID_HEIGHT);

    return {
        field,
        stairPos,
        player: {
            type: "player", hitPoint: playerMaxHitPoint, attack: 0, pos: playerPos, inventory: new Map(),
            ...player,
        },
        enemy: { type: "enemy", hitPoint: 5, attack: 1, pos: enemyPos },
    }
}

export function score({ floor, inventory }: {
    floor: number,
    inventory: Map<typeof ItemNames[number], number>,
}): number {
    const potions = inventory.get("potion") ?? 0;
    const deUSD = inventory.get("deUSD") ?? 0;
    return floor * 12 + potions * 77 + deUSD * 151;
}
