import { ItemNames } from "~/pkg/dungeon/item";

type Line = Tile[];

type Tile = {
    type: "wall" | "floor" | "stair";
} | {
    type: "item";
    itemName: typeof ItemNames[number];
};

export type Field = Line[]

export type Position = { x: number; y: number }

export type GenerateField = {
    field: Field,
    stairPos: Position,
    playerPos: Position,
    enemyPos: Position,
}

export function generateField(GRID_WIDTH: number, GRID_HEIGHT: number): GenerateField {
    const field: Field = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push({ type: "wall" });
        }
        field.push(row);
    }

    const totalTiles = GRID_WIDTH * GRID_HEIGHT;
    const floorThreshold = Math.floor(totalTiles * 0.4);

    let currentX = 0;
    let currentY = 0;
    field[currentY][currentX].type = "floor";
    let floorCount = 1;

    while (floorCount < floorThreshold) {
        const directions = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
        ];
        const { dx, dy } = directions[Math.floor(Math.random() * directions.length)];
        const newX = currentX + dx;
        const newY = currentY + dy;
        if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
            continue;
        }
        currentX = newX;
        currentY = newY;
        if (field[currentY][currentX].type === "wall") {
            field[currentY][currentX].type = "floor";
            floorCount++;
        }
    }

    // floor（床）の位置をすべて収集
    const floorCells: Position[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (field[y][x].type === "floor") {
                floorCells.push({ x, y });
            }
        }
    }

    if (floorCells.length === 0) {
        throw new Error("床セルが存在しません。マップ生成に失敗しました。");
    }

    // 階段を配置するセルをランダムに選択
    const stairCell = floorCells[Math.floor(Math.random() * floorCells.length)];
    field[stairCell.y][stairCell.x].type = "stair";

    // 階段セルを除外して、プレイヤーの初期位置を選ぶ
    const availableFloorCells = floorCells.filter(cell => cell.x !== stairCell.x || cell.y !== stairCell.y);

    // availableFloorCellsが空の場合は、どうしても床セルが1箇所しかなかったケースなので、階段のセルを使う
    const playerCell = availableFloorCells.length > 0
        ? availableFloorCells[Math.floor(Math.random() * availableFloorCells.length)]
        : stairCell;


    const enemyCell = availableFloorCells.filter(cell => cell.x !== playerCell.x || cell.y !== playerCell.y);
    const enemyPos = enemyCell[Math.floor(Math.random() * enemyCell.length)];

    // 階段、プレイヤー、敵の位置を決定後、残りの床からアイテムを配置
    const itemCells = availableFloorCells.filter(
        cell => (cell.x !== playerCell.x || cell.y !== playerCell.y) &&
            (cell.x !== enemyPos.x || cell.y !== enemyPos.y)
    );

    // 1-2個のアイテムをランダムに配置
    const itemCount = Math.floor(Math.random() * 2);

    for (let i = 0; i < Math.min(itemCount, itemCells.length); i++) {
        const index = Math.floor(Math.random() * itemCells.length);
        const itemCell = itemCells[index];
        const itemName = ItemNames[Math.floor(Math.random() * ItemNames.length)];
        field[itemCell.y][itemCell.x] = { type: "item", itemName };
        itemCells.splice(index, 1);
    }

    return { field, stairPos: stairCell, playerPos: playerCell, enemyPos }
}
