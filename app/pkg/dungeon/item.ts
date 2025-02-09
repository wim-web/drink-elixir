// app/pkg/dungeon/item.ts
export const ItemNames = ["potion", "deUSD"] as const;

export interface Item {
    name: typeof ItemNames[number];
}
