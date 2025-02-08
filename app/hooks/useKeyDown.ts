
import { useCallback } from "react";
import type { Tile } from "~/pkg/map/generate";


export function useKeyDown(gameClear: boolean, mapData: Tile[][], setPlayerPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>) {
    return useCallback(
        (e: KeyboardEvent) => {
            if (gameClear) return;
            let dx = 0,
                dy = 0;
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
                if (newX < 0 || newX >= mapData[0].length || newY < 0 || newY >= mapData.length) {
                    return prev;
                }
                if (mapData[newY][newX].type === "wall") return prev;
                return { x: newX, y: newY };
            });
        },
        [gameClear, mapData, setPlayerPos]
    );
}
