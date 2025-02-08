type Line = Tile[];

type Tile = {
    type: "wall" | "floor" | "stair";
};

export type Map = Line[]

export type Position = { x: number; y: number }

export type GenerateMap = { map: Map; stairPos: Position, playerPos: Position }

export function generateMap(GRID_WIDTH: number, GRID_HEIGHT: number): GenerateMap {
    const map: Tile[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push({ type: "wall" });
        }
        map.push(row);
    }

    const totalTiles = GRID_WIDTH * GRID_HEIGHT;
    const floorThreshold = Math.floor(totalTiles * 0.4);

    let currentX = 0;
    let currentY = 0;
    map[currentY][currentX].type = "floor";
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
        if (map[currentY][currentX].type === "wall") {
            map[currentY][currentX].type = "floor";
            floorCount++;
        }
    }

    // floor（床）の位置をすべて収集
    const floorCells: Position[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (map[y][x].type === "floor") {
                floorCells.push({ x, y });
            }
        }
    }

    if (floorCells.length === 0) {
        throw new Error("床セルが存在しません。マップ生成に失敗しました。");
    }

    // 階段を配置するセルをランダムに選択
    const stairCell = floorCells[Math.floor(Math.random() * floorCells.length)];
    map[stairCell.y][stairCell.x].type = "stair";

    // 階段セルを除外して、プレイヤーの初期位置を選ぶ
    const availableFloorCells = floorCells.filter(cell => cell.x !== stairCell.x || cell.y !== stairCell.y);

    // availableFloorCellsが空の場合は、どうしても床セルが1箇所しかなかったケースなので、階段のセルを使う
    const playerCell = availableFloorCells.length > 0
        ? availableFloorCells[Math.floor(Math.random() * availableFloorCells.length)]
        : stairCell;

    return { map, stairPos: stairCell, playerPos: playerCell };
}
