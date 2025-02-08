
export type Tile = {
    type: "wall" | "floor" | "stair";
};

export function generateMap(GRID_WIDTH: number, GRID_HEIGHT: number): { map: Tile[][]; stairPos: { x: number; y: number } } {
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

    const floorCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (map[y][x].type === "floor" && (x !== 0 || y !== 0)) {
                floorCells.push({ x, y });
            }
        }
    }
    const stairCell = floorCells[Math.floor(Math.random() * floorCells.length)];
    map[stairCell.y][stairCell.x].type = "stair";

    return { map, stairPos: stairCell };
}
