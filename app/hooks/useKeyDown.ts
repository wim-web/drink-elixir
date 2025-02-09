
import { useCallback } from "react";
import type { Field, Position } from "~/pkg/dungeon/field";



export function useKeyDown(gameOver: boolean, field: Field, setPlayerPos: React.Dispatch<React.SetStateAction<Position>>) {
    return useCallback(
        (e: KeyboardEvent) => {
            if (gameOver) return;
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
                if (newX < 0 || newX >= field[0].length || newY < 0 || newY >= field.length) {
                    return prev;
                }
                if (field[newY][newX].type === "wall") return prev;
                return { x: newX, y: newY };
            });
        },
        [gameOver, field, setPlayerPos]
    );
}
