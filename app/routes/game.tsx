import { useEffect, useState, useCallback } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import { useKeyDown } from "~/hooks/useKeyDown";
import type { Route } from './+types/game';
import { useFetcher } from "react-router";
import { FaStairs } from "react-icons/fa6";
import { getSession, saveData } from "~/pkg/session/db";
import { suspend } from "~/pkg/session";
import { generateMap, score, type DungeonMap } from "~/pkg/dungeon/map";
import type { Field, Position } from "~/pkg/dungeon/field";
import { playerMaxHitPoint } from "~/pkg/dungeon/piece";


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
            ...generateMap({}),
            session,
            floor: 1,
        }
    }

    let { floor, loadCount, player } = result.data;
    loadCount++;
    if (loadCount != floor) {
        return await suspend(db, session);
    }

    await saveData(db, session, { floor, loadCount, player });

    console.log(player);

    return {
        ...generateMap({ player }),
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

    const playerHP = formData.get("player.hitPoint")?.toString();
    const inventoryStr = formData.get("player.inventory")?.toString();

    const inventory: Map<string, number> = inventoryStr ? new Map(Object.entries(JSON.parse(inventoryStr))) : new Map([]);

    result.data.floor += 1;
    result.data.player = {
        hitPoint: parseInt(playerHP ?? "0"),
        inventory: inventory
    };

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
    const loaderData = useLoaderData<
        DungeonMap & { session: string; floor: number }
    >();

    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [enemyPos, setEnemyPos] = useState({ x: 0, y: 0 });
    const [playerHP, setPlayerHP] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const { field, stairPos, enemy, player, session, floor } = loaderData;

    useEffect(() => {
        setPlayerPos(player.pos);
        setEnemyPos(enemy.pos);
        setPlayerHP(player.hitPoint);
    }, [loaderData]);

    // useKeyDown フック内で setPlayerPos を使った後、敵の処理を呼ぶ
    const handleKeyDown = useCallback(useKeyDown(gameOver, field, (pos) => {
        const newPos = typeof pos === 'function' ? pos(playerPos) : pos;
        setPlayerPos(newPos);

        // アイテムを踏んだ場合の処理を追加
        const tile = field[newPos.y][newPos.x];
        if (tile.type === "item") {
            const itemName = tile.itemName;
            const currentCount = player.inventory.get(itemName) ?? 0;
            player.inventory.set(itemName, currentCount + 1);

            // potionを踏んだ場合はHPを回復
            if (itemName === "potion") {
                const healAmount = Math.floor(Math.random() * 4) + 1; // 1-5のランダムな値
                setPlayerHP(currentHP => Math.min(currentHP + healAmount, playerMaxHitPoint)); // 最大HPを20に設定
            }

            // 床に変更
            field[newPos.y][newPos.x] = { type: "floor" };
        }

        // プレイヤーが階段に到達していない場合のみ敵を移動
        if (!(newPos.x === stairPos.x && newPos.y === stairPos.y)) {
            const { position: newEnemyPos, isAttack } = enemyMove(newPos, enemyPos);
            if (isAttack) {
                setPlayerHP(currentHP => {
                    const newHP = currentHP - 1;
                    if (newHP <= 0) {
                        setGameOver(true);
                    }
                    return newHP;
                });
            }
            setEnemyPos(newEnemyPos);
        } else {
            const data = new FormData();
            data.append("session", session);
            data.append("player.hitPoint", playerHP.toString());
            // インベントリをJSON文字列として保存
            data.append("player.inventory", JSON.stringify(Object.fromEntries(player.inventory)));
            fetcher.submit(data, { action: "/game", method: "POST" });
        }
    }), [gameOver, field, playerPos, enemyPos, player, stairPos, session]); // 必要な依存関係のみを指定

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]); // playerHPを依存配列から除去


    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h2>
                Floor: {floor} / HP: {playerHP} /
                P: {player.inventory.get("potion") ?? 0} /
                D: {player.inventory.get("deUSD") ?? 0}
            </h2>
            <MapUI field={field} newPlayerPos={playerPos} enemyPos={enemyPos} />
            <p>Use Arrow keys or vim keys (h, j, k, l) to move</p>
            {gameOver && (
                <div style={{ textAlign: "center", marginTop: "20vh" }}>
                    <h1>Game Over...</h1>
                    <p>Your score is {score({ floor, inventory: player.inventory })}</p>
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

function MapUI({
    field,
    newPlayerPos,
    enemyPos,
}: { field: Field; newPlayerPos: Position; enemyPos: Position }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${field.length}, 40px)`,
                gridTemplateRows: `repeat(${field[0].length}, 40px)`,
                gap: "2px",
                justifyContent: "center",
                margin: "auto",
            }}
        >
            {field.map((row, y) =>
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
                            {tile.type === "item" && (
                                <img
                                    src={tile.itemName === "potion" ? "/potion.jpg" : "/deusd.png"}
                                    alt={tile.itemName}
                                    style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, backgroundColor: "pink" }}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    )
}
