import { useEffect, useState, useCallback } from "react";
import { Link, redirect, useLoaderData, Form } from "react-router";
import { generateMap, type GenerateMap, type Position } from "../pkg/map/generate";
import { useKeyDown } from "~/hooks/useKeyDown";
import type { Route } from './+types/game';
import { useFetcher } from "react-router";
import { FaStairs } from "react-icons/fa6";
import { getSession, saveData } from "~/pkg/session/db";
import { suspend } from "~/pkg/session";


const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;


export async function loader(args: Route.LoaderArgs) {
    const db = args.context.hono.context.env.DB;
    const url = new URL(args.request.url);
    const session = url.searchParams.get("session")?.toString()

    if (session === undefined) {
        return redirect("/");
    }

    const result = await getSession(db, session);

    if (result === null) {
        return await suspend(db, session);
    }

    // 初回アクセス時
    if (result.data === null) {
        await saveData(db, session, {
            floor: 1,
            loadCount: 1,
        });

        return {
            ...generateMap(GRID_WIDTH, GRID_HEIGHT),
            session,
            floor: 1,
        }
    }

    let { floor, loadCount } = result.data;
    loadCount++;
    if (loadCount != floor) {
        return await suspend(db, session);
    }

    await saveData(db, session, { floor, loadCount });

    return {
        ...generateMap(GRID_WIDTH, GRID_HEIGHT),
        session,
        floor,
    }
}



export async function action(args: Route.ActionArgs) {
    const formData = await args.request.formData();
    const session = formData.get("session")?.toString();

    if (session === undefined) {
        return redirect("/");
    }

    const db = args.context.hono.context.env.DB;

    const result = await getSession(db, session);

    if (result === null || result.data === null) {
        return await suspend(db, session);
    }

    result.data.floor += 1;

    await saveData(db, session, result.data);
}

function enemyMove(playerPos: Position, enemyPos: Position): { position: Position; isAttack: boolean } {
    const dx = playerPos.x - enemyPos.x;
    const dy = playerPos.y - enemyPos.y;
    // 敵が一マス以内なら攻撃し移動はしない
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        return { position: enemyPos, isAttack: true };
    }

    // x方向とy方向の距離を比較し、大きい方向に移動
    if (Math.abs(dx) > Math.abs(dy)) {
        // x方向に移動
        return {
            position: { x: enemyPos.x + (dx > 0 ? 1 : -1), y: enemyPos.y },
            isAttack: false
        };
    } else {
        // y方向に移動
        return {
            position: { x: enemyPos.x, y: enemyPos.y + (dy > 0 ? 1 : -1) },
            isAttack: false
        };
    }
}

export default function Game() {
    const fetcher = useFetcher();
    const { map, stairPos, playerPos, session, floor } = useLoaderData<
        GenerateMap & { session: string; floor: number }
    >();

    const [newPlayerPos, setPlayerPos] = useState(playerPos);
    const [enemyPos, setEnemyPos] = useState<Position>({ x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 });
    const [playerHP, setPlayerHP] = useState(10);
    const [gameOver, setGameOver] = useState(false);

    // プレイヤー動作後に敵を動かす処理
    const moveEnemy = useCallback(
        (updatedPlayerPos: Position) => {
            const { position: newEnemyPos, isAttack } = enemyMove(updatedPlayerPos, enemyPos);
            if (isAttack) {
                setPlayerHP((prev) => prev - 1);
            }
            setEnemyPos(newEnemyPos);
        },
        [enemyPos]
    );

    // useKeyDown フック内で setPlayerPos を使った後、敵の処理を呼ぶ
    const handleKeyDown = useKeyDown(gameOver, map, (pos) => {
        const newPos = typeof pos === 'function' ? pos(newPlayerPos) : pos;
        setPlayerPos(newPos);
        // プレイヤーが階段に到達していない場合のみ敵を移動
        if (!(newPos.x === stairPos.x && newPos.y === stairPos.y)) {
            moveEnemy(newPos);
        }
    });

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        // HPが0以下になった場合の処理（例: トップに戻すなど）
        if (playerHP <= 0) {
            setGameOver(true)
        }
    }, [playerHP]);

    useEffect(() => {
        setPlayerPos(playerPos);
    }, [playerPos]);

    useEffect(() => {
        if (newPlayerPos.x === stairPos.x && newPlayerPos.y === stairPos.y) {
            const data = new FormData();
            data.append("session", session);
            fetcher.submit(data, { action: "/game", method: "POST" });
        }
    }, [newPlayerPos]);

    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h2>Floor: {floor} / HP: {playerHP}</h2>
            <Map map={map} newPlayerPos={newPlayerPos} enemyPos={enemyPos} />
            <p>Use Arrow keys or vim keys (h, j, k, l) to move</p>
            {gameOver && (
                <div style={{ textAlign: "center", marginTop: "20vh" }}>
                    <h1>Game Over...</h1>
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
            )}
        </div>
    );
}

function Map({
    map,
    newPlayerPos,
    enemyPos,
}: { map: GenerateMap["map"]; newPlayerPos: Position; enemyPos: Position }) {
    return (
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
            {map.map((row, y) =>
                row.map((tile, x) => {
                    let bgColor = "#333";
                    if (tile.type === "floor") {
                        bgColor = "#eee";
                    }
                    if (tile.type === "stair") {
                        bgColor = "#fff";
                    }
                    return (
                        <div
                            key={`${x}-${y}`}
                            style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor: bgColor,
                                border: "1px solid #ccc",
                                position: "relative",
                            }}
                        >
                            {tile.type === "stair" && (
                                <FaStairs
                                    style={{
                                        color: "black",
                                        position: "absolute",
                                        width: "100%",
                                        height: "100%",
                                        top: 0,
                                        left: 0,
                                    }}
                                />
                            )}
                            {/* プレイヤー描画 */}
                            {newPlayerPos.x === x && newPlayerPos.y === y && (
                                <img
                                    src="/bozo.png"
                                    alt="player"
                                    style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                                />
                            )}
                            {/* 敵描画 */}
                            {enemyPos.x === x && enemyPos.y === y && (
                                <img
                                    src="/cat_devil.png"
                                    alt="player"
                                    style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    )
}
