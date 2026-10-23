import db from '../config/db.js';

export async function writeAudit({
  actorId = null,
  action,
  entityType = null,
  entityId = null,
  oldValue = null,
  newValue = null,
  result = 'ok',
  reason = null,
}) {
  const pack = (value) => {
    if (value == null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  };
  await db.query('INSERT INTO audit_logs SET ?', {
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId == null ? null : String(entityId),
    old_value: pack(oldValue),
    new_value: pack(newValue),
    result,
    reason,
  });
}
