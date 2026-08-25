/**
 * Knowledge graph — entities + relations for retrieval and reasoning support.
 */

export type EntityType =
  | "customer"
  | "company"
  | "person"
  | "product"
  | "transaction"
  | "document"
  | "project"
  | "agent"
  | "model"
  | "task"
  | "goal"
  | "kpi"
  | "competitor"
  | "supplier"
  | "employee"
  | "technology"
  | "other";

export interface KgEntity {
  id: string;
  type: EntityType;
  name: string;
  properties?: Record<string, string | number | boolean>;
  freshnessScore?: number;
  updatedAt: string;
}

export interface KgRelation {
  id: string;
  from: string;
  to: string;
  type: string;
  weight?: number;
  updatedAt: string;
}

const entities = new Map<string, KgEntity>();
const relations = new Map<string, KgRelation>();

export function upsertEntity(
  input: Omit<KgEntity, "updatedAt"> & { updatedAt?: string }
): KgEntity {
  const e: KgEntity = {
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    freshnessScore: input.freshnessScore ?? 1,
  };
  entities.set(e.id, e);
  return e;
}

export function linkEntities(
  from: string,
  to: string,
  type: string,
  weight = 1
): KgRelation {
  const id = `${from}|${type}|${to}`;
  const r: KgRelation = {
    id,
    from,
    to,
    type,
    weight,
    updatedAt: new Date().toISOString(),
  };
  relations.set(id, r);
  return r;
}

export function getEntity(id: string): KgEntity | undefined {
  return entities.get(id);
}

export function neighbors(id: string): Array<{ relation: KgRelation; entity?: KgEntity }> {
  const out: Array<{ relation: KgRelation; entity?: KgEntity }> = [];
  for (const r of relations.values()) {
    if (r.from === id) out.push({ relation: r, entity: entities.get(r.to) });
    if (r.to === id) out.push({ relation: r, entity: entities.get(r.from) });
  }
  return out;
}

export function searchEntities(q: string, limit = 20): KgEntity[] {
  const s = q.toLowerCase();
  return [...entities.values()]
    .filter((e) => e.name.toLowerCase().includes(s) || e.id.includes(s) || e.type.includes(s))
    .slice(0, limit);
}

export function graphStats() {
  return { entities: entities.size, relations: relations.size };
}

export function listEntities(limit = 100): KgEntity[] {
  return [...entities.values()].slice(0, limit);
}
