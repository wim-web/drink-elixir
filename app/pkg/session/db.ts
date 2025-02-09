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

    return {
        ...result,
        data: JSON.parse(result.data) as StoreData,
    }
}

export async function saveData(db: D1Database, session: string, data: StoreData) {
    await db.prepare("UPDATE session SET data = ? WHERE session = ?")
        .bind(JSON.stringify(data), session)
        .run();
}
