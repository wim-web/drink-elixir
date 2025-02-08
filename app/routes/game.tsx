// Game.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

// Tile の型：壁、床、階段
type Tile = {
    type: "wall" | "floor" | "stair";
};

// ドランカーウォーク（穴掘り法）でマップを生成する関数
function generateMap(): { map: Tile[][]; stairPos: { x: number; y: number } } {
    // まず全セルを壁にする
    const map: Tile[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push({ type: "wall" });
        }
        map.push(row);
    }

    // 目標：全体の約40%を床にする（10×10 の場合 40 タイル）
    const totalTiles = GRID_WIDTH * GRID_HEIGHT;
    const floorThreshold = Math.floor(totalTiles * 0.4);

    // 開始位置は (0,0) からスタート
    let currentX = 0;
    let currentY = 0;
    map[currentY][currentX].type = "floor";
    let floorCount = 1;

    // ランダムウォークで床を掘り進める
    while (floorCount < floorThreshold) {
        const directions = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
        ];
        // ランダムに方向を選択
        const { dx, dy } = directions[Math.floor(Math.random() * directions.length)];
        const newX = currentX + dx;
        const newY = currentY + dy;
        // グリッド外の場合はスキップ
        if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
            continue;
        }
        // 移動先に更新
        currentX = newX;
        currentY = newY;
        // もし壁なら床にしてカウントを増やす
        if (map[currentY][currentX].type === "wall") {
            map[currentY][currentX].type = "floor";
            floorCount++;
        }
    }

    // (0,0) 以外の床セルの中からランダムに階段配置候補を選ぶ
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

export default function Game() {
    const [floor, setFloor] = useState(1);
    const [mapData, setMapData] = useState<Tile[][]>([]);
    const [stairPos, setStairPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [gameClear, setGameClear] = useState(false);

    // 現在の階のマップを生成する
    const initFloor = useCallback(() => {
        const { map, stairPos } = generateMap();
        setMapData(map);
        setStairPos(stairPos);
        setPlayerPos({ x: 0, y: 0 }); // プレイヤーは常に (0,0) から開始
    }, []);

    useEffect(() => {
        initFloor();
    }, [initFloor]);

    // キー入力処理（矢印キーおよび vim バインド：h, j, k, l）
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (gameClear) return;
            let dx = 0, dy = 0;
            switch (e.key) {
                case "ArrowUp":
                case "k":
                case "K":
                    dy = -1;
                    break;
                case "ArrowDown":
                case "j":
                case "J":
                    dy = 1;
                    break;
                case "ArrowLeft":
                case "h":
                case "H":
                    dx = -1;
                    break;
                case "ArrowRight":
                case "l":
                case "L":
                    dx = 1;
                    break;
                default:
                    return;
            }
            e.preventDefault();
            setPlayerPos((prev) => {
                const newX = prev.x + dx;
                const newY = prev.y + dy;
                // グリッド外には進まない
                if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
                    return prev;
                }
                // 移動先が壁の場合は移動できない
                if (mapData.length > 0 && mapData[newY][newX].type === "wall") {
                    return prev;
                }
                return { x: newX, y: newY };
            });
        },
        [gameClear, mapData]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // プレイヤーが階段に到達した場合、次の階へ移行（10F 到達でゲームクリア）
    useEffect(() => {
        if (playerPos.x === stairPos.x && playerPos.y === stairPos.y) {
            if (floor >= 10) {
                setGameClear(true);
            } else {
                setFloor((prev) => prev + 1);
                initFloor();
            }
        }
    }, [playerPos, stairPos, floor, initFloor]);

    if (gameClear) {
        return (
            <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <h1>Game Clear!</h1>
                <Link to="/" style={{ textDecoration: "none" }}>
                    <button
                        style={{
                            fontSize: "24px",
                            padding: "10px 20px",
                            cursor: "pointer",
                        }}
                    >
                        Return to Top
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h2>Floor: {floor}</h2>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_WIDTH}, 40px)`,
                    gridTemplateRows: `repeat(${GRID_HEIGHT}, 40px)`,
                    gap: "2px",
                    justifyContent: "center",
                    margin: "auto",
                }}
            >
                {mapData.flatMap((row, y) =>
                    row.map((tile, x) => {
                        let bgColor = "#333"; // 壁は濃いグレー
                        if (tile.type === "floor") {
                            bgColor = "#eee"; // 床は薄いグレー
                        }
                        if (tile.type === "stair") {
                            bgColor = "#ff0"; // 階段は黄色
                        }
                        if (playerPos.x === x && playerPos.y === y) {
                            bgColor = "#0f0"; // プレイヤーは緑
                        }
                        return (
                            <div
                                key={`${x}-${y}`}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    backgroundColor: bgColor,
                                    border: "1px solid #ccc",
                                }}
                            ></div>
                        );
                    })
                )}
            </div>
            <p>Use Arrow keys or vim keys (h, j, k, l) to move</p>
        </div>
    );
}
