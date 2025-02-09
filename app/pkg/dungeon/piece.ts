import type { Item, ItemNames } from "~/pkg/dungeon/item"

export type Piece = {
    type: "player" | "enemy",
    hitPoint: number,
    attack: number,
}

export type Player = Piece & {
    type: "player",
    attack: 0,
    inventory: Map<typeof ItemNames[number], number>,
}

export type Enemy = Piece & {
    type: "enemy"
}
