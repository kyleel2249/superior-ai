import { buildStoryBoard, type Storyboard } from "@superior-ai/creative";
import { auditPage, type SeoAuditResult } from "@superior-ai/seo";

export interface CampaignBrief {
  id: string;
  objective: string;
  audience: string;
  channels: string[];
  storyboard: Storyboard;
  landingPageAudit?: SeoAuditResult;
  createdAt: string;
}

export async function buildCampaignBrief(input: {
  objective: string;
  audience: string;
  painPoint: string;
  offer: string;
  cta: string;
  channels?: string[];
  landingPageUrl?: string;
}): Promise<CampaignBrief> {
  const storyboard = buildStoryBoard({
    product: input.objective,
    audience: input.audience,
    painPoint: input.painPoint,
    offer: input.offer,
    cta: input.cta,
  });
  const landingPageAudit = input.landingPageUrl ? await auditPage(input.landingPageUrl) : undefined;
  return {
    id: `camp_${Date.now().toString(36)}`,
    objective: input.objective,
    audience: input.audience,
    channels: input.channels ?? ["email", "social"],
    storyboard,
    landingPageAudit,
    createdAt: new Date().toISOString(),
  };
}
