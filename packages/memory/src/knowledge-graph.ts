/**
 * Lightweight knowledge graph over memory entities — relations, not a full graph DB.
 */

export type EntityKind =
  | "customer"
  | "product"
  | "competitor"
  | "campaign"
  | "project"
  | "decision"
  | "person"
  | "concept";

export interface GraphEntity {
  id: string;
  kind: EntityKind;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  weight: number;
  createdAt: string;
}

const entities = new Map<string, GraphEntity>();
const edges: GraphEdge[] = [];

export function upsertEntity(e: Omit<GraphEntity, "id"> & { id?: string }): GraphEntity {
  const id = e.id ?? `ent_${e.kind}_${e.label.toLowerCase().replace(/\W+/g, "_").slice(0, 40)}`;
  const full: GraphEntity = { id, kind: e.kind, label: e.label, metadata: e.metadata };
  entities.set(id, full);
  return full;
}

export function linkEntities(
  from: string,
  to: string,
  relation: string,
  weight = 1
): GraphEdge {
  const edge: GraphEdge = {
    id: `edge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    from,
    to,
    relation,
    weight,
    createdAt: new Date().toISOString(),
  };
  edges.push(edge);
  return edge;
}

export function neighbors(entityId: string, limit = 20): Array<{ edge: GraphEdge; entity?: GraphEntity }> {
  return edges
    .filter((e) => e.from === entityId || e.to === entityId)
    .slice(0, limit)
    .map((edge) => ({
      edge,
      entity: entities.get(edge.from === entityId ? edge.to : edge.from),
    }));
}

export function graphSnapshot(): { entities: number; edges: number } {
  return { entities: entities.size, edges: edges.length };
}

export function clearGraph(): void {
  entities.clear();
  edges.length = 0;
}
