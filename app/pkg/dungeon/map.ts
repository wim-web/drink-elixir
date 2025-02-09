import { generateFloor, type Field, type Position } from "~/pkg/dungeon/field";
import type { Enemy, Player } from "~/pkg/dungeon/piece";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

export type Map = {
    field: Field,
    stairPos: Position,
    player: Player & { pos: Position },
    enemy: Enemy & { pos: Position },
}

export function generateMap({ player }: {
    player?: { hitPoint: number, }
}): Map {
    const { field, stairPos, playerPos, enemyPos } = generateFloor(GRID_WIDTH, GRID_HEIGHT);

    return {
        field,
        stairPos,
        player: {
            type: "player", hitPoint: 10, attack: 0, pos: playerPos,
            ...player,
        },
        enemy: { type: "enemy", hitPoint: 5, attack: 1, pos: enemyPos },
    }
}
