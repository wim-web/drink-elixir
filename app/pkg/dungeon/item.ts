// app/pkg/dungeon/item.ts
export const ItemNames = ["potion", "deUSD"];

export interface Item {
    name: typeof ItemNames[number];
}
