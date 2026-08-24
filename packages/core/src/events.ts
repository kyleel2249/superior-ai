/**
 * In-process event bus — foundation for cross-module events.
 * Optional Redis pub/sub can wrap this later without changing subscribers.
 */

export type EventHandler<T = unknown> = (payload: T, meta: { event: string; at: string }) => void | Promise<void>;

const handlers = new Map<string, Set<EventHandler>>();
const history: Array<{ event: string; at: string; payload: unknown }> = [];
const MAX_HISTORY = 200;

export function onEvent<T = unknown>(event: string, handler: EventHandler<T>): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler as EventHandler);
  return () => {
    handlers.get(event)?.delete(handler as EventHandler);
  };
}

export async function emitEvent<T = unknown>(event: string, payload: T): Promise<void> {
  const at = new Date().toISOString();
  history.push({ event, at, payload });
  if (history.length > MAX_HISTORY) history.shift();
  const set = handlers.get(event);
  if (!set || set.size === 0) return;
  await Promise.all(
    [...set].map(async (h) => {
      try {
        await h(payload, { event, at });
      } catch (err) {
        console.error(JSON.stringify({ level: "error", msg: "event handler failed", event, error: String(err) }));
      }
    })
  );
  // wildcard listeners
  const wild = handlers.get("*");
  if (wild) {
    await Promise.all(
      [...wild].map(async (h) => {
        try {
          await h(payload, { event, at });
        } catch {
          /* ignore */
        }
      })
    );
  }
}

export function getEventHistory(limit = 50): Array<{ event: string; at: string; payload: unknown }> {
  return history.slice(-limit);
}

export function clearEventHandlers(): void {
  handlers.clear();
}
