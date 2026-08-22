import { createCheckoutSession } from "./checkout";

const DEFAULT_PRICE_MAP: Record<string, string> = {
  "pack.creative.studio": process.env.PACK_PRICE_CREATIVE_STUDIO || "",
  "pack.finance.ops": process.env.PACK_PRICE_FINANCE_OPS || "",
  "pack.support.success": process.env.PACK_PRICE_SUPPORT_SUCCESS || "",
};

function priceMap(): Record<string, string> {
  const map = { ...DEFAULT_PRICE_MAP };
  if (process.env.PACK_PRICE_JSON) {
    try {
      Object.assign(map, JSON.parse(process.env.PACK_PRICE_JSON));
    } catch { /* ignore */ }
  }
  return map;
}

export function getPackPriceId(packId: string): string | null {
  return priceMap()[packId] || null;
}

export async function checkoutAgentPack(input: {
  packId: string;
  email?: string;
  customerId?: string;
  organizationId?: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const priceId = getPackPriceId(input.packId) || process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return { error: `No Stripe price for pack ${input.packId}. Set PACK_PRICE_JSON or STRIPE_PRICE_ID.` };
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const result = await createCheckoutSession({
    customerId: input.customerId,
    customerEmail: input.email,
    priceId,
    successUrl: input.successUrl || `${appUrl}/admin/packs?checkout=success&pack=${encodeURIComponent(input.packId)}`,
    cancelUrl: input.cancelUrl || `${appUrl}/admin/packs?checkout=cancel`,
    organizationId: input.organizationId,
    mode: "subscription",
  });
  return { ...result, priceId };
}

export function listPricedPacks() {
  return Object.entries(priceMap())
    .filter(([, v]) => Boolean(v))
    .map(([packId, priceId]) => ({ packId, priceId }));
}
