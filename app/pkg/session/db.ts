import type { SessionRow, StoreData } from "~/pkg/session";

export async function getSession(db: D1Database, session: string) {
    const result = await db.prepare("SELECT * FROM session WHERE session = ?")
        .bind(session)
        .first<SessionRow>();

    if (result === null) {
        return null;
    }

    if (result.data === null) {
        return {
            ...result,
            data: null,
        }
    }

    const storeDataObj = JSON.parse(result.data) as StoreData;
    if (storeDataObj.player) {
        storeDataObj.player.inventory = new Map(Object.entries(storeDataObj.player.inventory));
    }

    return {
        ...result,
        data: storeDataObj,
    }
}

export async function saveData(db: D1Database, session: string, data: StoreData) {
    const serialized = JSON.stringify({
        ...data,
        player: data.player && {
            ...data.player,
            inventory: Object.fromEntries(data.player.inventory),
        },
    });
    await db.prepare("UPDATE session SET data = ? WHERE session = ?")
        .bind(serialized, session)
        .run();
}
