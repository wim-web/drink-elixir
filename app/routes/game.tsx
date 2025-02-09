import { useEffect, useState, useCallback } from "react";
import { Link, redirect, useLoaderData, Form } from "react-router";
import { generateMap, type GenerateMap } from "../pkg/map/generate";
import { useKeyDown } from "~/hooks/useKeyDown";
import type { Route } from './+types/game';
import { useFetcher } from "react-router";
import { FaStairs } from "react-icons/fa6";


const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

type SessionRow = {
    session: string;
    data: string | null;
}

export async function loader(args: Route.LoaderArgs) {
    const db = args.context.hono.context.env.DB;
    const url = new URL(args.request.url);
    const session = url.searchParams.get("session")

    if (session === null) {
        return redirect("/");
    }

    const result = await db.prepare("SELECT * FROM session WHERE session = ?")
        .bind(session)
        .first<SessionRow>();

    if (result === null) {
        return redirect("/");
    }

    if (result.data === null) {
        const storeData: StoreData = {
            floor: 1,
            loadCount: 1,
        }
        await db.prepare("UPDATE session SET data = ? WHERE session = ?").bind(JSON.stringify(storeData), session).run();

        return {
            ...generateMap(GRID_WIDTH, GRID_HEIGHT),
            session,
            floor: 1,
        }
    }

    const data = JSON.parse(result.data) as StoreData;
    let { floor, loadCount } = data;
    loadCount++;
    if (loadCount != floor) {
        return redirect("/");
    }

    const storeData: StoreData = {
        floor,
        loadCount,
    }

    await db.prepare("UPDATE session SET data = ? WHERE session = ?").bind(JSON.stringify(storeData), session).run();

    return {
        ...generateMap(GRID_WIDTH, GRID_HEIGHT),
        session,
        floor,
    }
}

type StoreData = {
    floor: number;
    loadCount: number;
}

export async function action(args: Route.ActionArgs) {
    const formData = await args.request.formData();
    const session = formData.get("session");

    if (session === null) {
        return redirect("/");
    }

    const db = args.context.hono.context.env.DB;

    const result = await db.prepare("SELECT * FROM session WHERE session = ?")
        .bind(session).first<SessionRow>();

    if (result === null || result.data === null) {
        return redirect("/");
    }

    const storeData: StoreData = JSON.parse(result.data);

    storeData.floor += 1;

    await db.prepare("UPDATE session SET data = ? WHERE session = ?")
        .bind(JSON.stringify(storeData), session)
        .run();
}

export default function Game() {
    const fetcher = useFetcher();
    const { map, stairPos, playerPos, session, floor } = useLoaderData<GenerateMap & { session: string, floor: number }>();

    const [newPlayerPos, setPlayerPos] = useState(playerPos);
    const [gameClear, setGameClear] = useState(false);

    const handleKeyDown = useKeyDown(gameClear, map, setPlayerPos);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        setPlayerPos(playerPos);
    }, [playerPos]);

    useEffect(() => {
        if (newPlayerPos.x === stairPos.x && newPlayerPos.y === stairPos.y) {
            if (floor >= 10) {
                setGameClear(true);
            } else {
                const data = new FormData();
                data.append("session", session);
                fetcher.submit(data, { action: "/game", method: "POST" });
            }
        }
    }, [newPlayerPos]);

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
                {map.flatMap((row, y) =>
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
                                    position: "relative"
                                }}
                            >
                                {/* stiarのときはFaStairs */}
                                {tile.type === "stair" && (
                                    <FaStairs style={{
                                        color: "black",
                                        position: "absolute",
                                        width: "100%",
                                        height: "100%",
                                        top: 0,
                                        left: 0,
                                    }} />
                                )}
                                {newPlayerPos.x === x && newPlayerPos.y === y && (
                                    <img
                                        src="/bozo.png"
                                        alt="player"
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            top: 0,
                                            left: 0,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            <p>Use Arrow keys or vim keys (h, j, k, l) to move</p>
        </div>
    );
}
