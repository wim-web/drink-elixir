import { redirect } from "react-router";

export type SessionRow = {
    session: string;
    data: string | null;
}

export type StoreData = {
    floor: number;
    loadCount: number;
    player?: {
        hitPoint: number;
        inventory: Map<string, number>;
    }
}

export async function suspend(db: D1Database, session: string) {
    // delete session
    await db.prepare("DELETE FROM session WHERE session = ?").bind(session).run();
    return redirect("/");
}
