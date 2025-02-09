export type Piece = {
    type: "player" | "enemy",
    hitPoint: number,
    attack: number,
}

export type Player = Piece & {
    type: "player",
    attack: 0,
}

export type Enemy = Piece & {
    type: "enemy"
}
