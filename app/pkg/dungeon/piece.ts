import type { Item, ItemNames } from "~/pkg/dungeon/item"

export type Piece = {
    type: "player" | "enemy",
    hitPoint: number,
    attack: number,
}

export const playerMaxHitPoint = 20;

export type Player = Piece & {
    type: "player",
    attack: 0,
    inventory: Map<typeof ItemNames[number], number>,
}

export type Enemy = Piece & {
    type: "enemy"
}
