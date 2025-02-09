import { generateField, type Field, type Position } from "~/pkg/dungeon/field";
import type { Enemy, Player } from "~/pkg/dungeon/piece";

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
            type: "player", hitPoint: 20, attack: 0, pos: playerPos, inventory: new Map(),
            ...player,
        },
        enemy: { type: "enemy", hitPoint: 5, attack: 1, pos: enemyPos },
    }
}
