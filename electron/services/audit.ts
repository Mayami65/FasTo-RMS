import type { AppDatabase } from "../db";

export function audit(db: AppDatabase, payload: {
    userId?: number | null;
    action: string;
    details?: string;
    entity?: string;
    entityId?: string | number;
    before?: any;
    after?: any;
}) {
    try {
        const stmt = db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, ?, ?)
    `);

        // Mapping payload to existing schema (user_id, action, details)
        // The schema in db.ts currently only has these 3 columns.
        // Ideally we should migrate to add entity, entity_id, before_json, after_json as suggested.
        // For now, I will format the 'details' field to include the extra info if the schema isn't updated yet.

        let detailsStr = payload.details || '';
        if (payload.entity) detailsStr += ` | Entity: ${payload.entity} (ID: ${payload.entityId})`;
        if (payload.before) detailsStr += ` | Before: ${JSON.stringify(payload.before)}`;
        if (payload.after) detailsStr += ` | After: ${JSON.stringify(payload.after)}`;

        stmt.run(
            payload.userId ?? null,
            payload.action,
            detailsStr
        );
    } catch (error) {
        console.error("Failed to log audit:", error);
    }
}
