import { useEffect, useState, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import { generateMap, type Tile } from "../pkg/map/generate";
import { useKeyDown } from "~/hooks/useKeyDown";


const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

export async function loader() {
    console.log("Generating map...");
    return generateMap(GRID_WIDTH, GRID_HEIGHT);
}

export default function Game() {
    const data = useLoaderData() as { map: Tile[][]; stairPos: { x: number; y: number } };

    const [floor, setFloor] = useState(1);
    const [mapData, setMapData] = useState<Tile[][]>(data.map);
    const [stairPos, setStairPos] = useState<{ x: number; y: number }>(data.stairPos);
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [gameClear, setGameClear] = useState(false);

    const initFloor = useCallback(async () => {
        const newData = generateMap(GRID_WIDTH, GRID_HEIGHT);
        setMapData(newData.map);
        setStairPos(newData.stairPos);
        setPlayerPos({ x: 0, y: 0 });
    }, []);

    const handleKeyDown = useKeyDown(gameClear, mapData, setPlayerPos);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

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
                        let bgColor = "#333";
                        if (tile.type === "floor") {
                            bgColor = "#eee";
                        }
                        if (tile.type === "stair") {
                            bgColor = "#ff0";
                        }
                        if (playerPos.x === x && playerPos.y === y) {
                            bgColor = "#0f0";
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
