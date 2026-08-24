/**
 * Phase 1 foundation gap: no event bus existed anywhere in the repo.
 *
 * HONESTY NOTE: this is in-process only — subscribers in the same Node
 * process see every event, but this does NOT fan out across multiple
 * instances (that would need Redis pub/sub or similar, same pattern as
 * cache/queue). Labeled clearly rather than implied to be distributed.
 */

export interface SuperiorEvent<T = unknown> {
  id: string;
  type: string;
  payload: T;
  at: string;
}

type Listener = (event: SuperiorEvent) => void | Promise<void>;

const MAX_HISTORY = 500;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private wildcardListeners = new Set<Listener>();
  private history: SuperiorEvent[] = [];

  on(type: string, listener: Listener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  /** Subscribe to every event regardless of type. */
  onAny(listener: Listener): () => void {
    this.wildcardListeners.add(listener);
    return () => this.wildcardListeners.delete(listener);
  }

  async emit<T>(type: string, payload: T): Promise<SuperiorEvent<T>> {
    const event: SuperiorEvent<T> = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      at: new Date().toISOString(),
    };
    this.history.push(event as SuperiorEvent);
    if (this.history.length > MAX_HISTORY) this.history.shift();

    const handlers = [...(this.listeners.get(type) ?? []), ...this.wildcardListeners];
    await Promise.all(
      handlers.map(async (listener) => {
        try {
          await listener(event as SuperiorEvent);
        } catch (err) {
          // A listener throwing must not break emit() for other listeners or the caller.
          console.error(`[events] listener for "${type}" threw:`, err instanceof Error ? err.message : err);
        }
      })
    );
    return event;
  }

  recentEvents(limit = 50, type?: string): SuperiorEvent[] {
    const all = type ? this.history.filter((e) => e.type === type) : this.history;
    return all.slice(-limit).reverse();
  }

  listenerCount(type?: string): number {
    if (type) return this.listeners.get(type)?.size ?? 0;
    return Array.from(this.listeners.values()).reduce((sum, s) => sum + s.size, 0) + this.wildcardListeners.size;
  }
}

export const eventBus = new EventBus();
