import { NextRequest, NextResponse } from "next/server";
import {
  createUgcPackage,
  productTestimonialUgc,
  listCreatorPersonas,
  createFictionalAvatar,
  createAuthorizedAvatar,
  buildTalkingAvatarScript,
} from "@superior-ai/creative";

export async function GET() {
  return NextResponse.json({
    personas: listCreatorPersonas(),
    actions: ["ugc", "testimonial", "avatar", "talking"],
    note: "Real-person likeness/voice requires explicit authorization flags.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "ugc");

    if (action === "testimonial") {
      return NextResponse.json(
        productTestimonialUgc({
          product: String(body.product ?? "Product"),
          audience: String(body.audience ?? "customers"),
          quote: body.quote,
          region: body.region,
        })
      );
    }

    if (action === "avatar") {
      if (body.authorized) {
        const avatar = createAuthorizedAvatar({
          name: String(body.name ?? "Talent"),
          appearance: String(body.appearance ?? ""),
          voiceId: body.voiceId,
          likenessAuthorized: body.likenessAuthorization === true,
          voiceAuthorized: body.voiceAuthorization === true,
          documentationRef: body.documentationRef,
          style: body.style,
        });
        return NextResponse.json(avatar);
      }
      return NextResponse.json(
        createFictionalAvatar({
          name: body.name,
          style: body.style,
          appearance: body.appearance,
        })
      );
    }

    if (action === "talking") {
      const avatar = body.authorized
        ? createAuthorizedAvatar({
            name: String(body.name ?? "Talent"),
            appearance: String(body.appearance ?? ""),
            likenessAuthorized: body.likenessAuthorization === true,
            voiceAuthorized: body.voiceAuthorization === true,
            documentationRef: body.documentationRef,
          })
        : createFictionalAvatar({ name: body.name, style: body.style });

      const script = Array.isArray(body.script)
        ? body.script.map(String)
        : String(body.text ?? "Welcome. Here is a quick overview.")
            .split(/(?<=\.)\s+/)
            .filter(Boolean);

      return NextResponse.json(
        buildTalkingAvatarScript({
          avatar,
          script,
          product: body.product,
        })
      );
    }

    // default UGC package
    return NextResponse.json(
      createUgcPackage({
        product: String(body.product ?? "Product"),
        audience: String(body.audience ?? "customers"),
        painPoint: body.painPoint,
        cta: body.cta,
        platform: body.platform,
        durationSec: body.durationSec,
        format: body.format,
        personaId: body.personaId,
        likenessAuthorization: body.likenessAuthorization === true,
        voiceAuthorization: body.voiceAuthorization === true,
        region: body.region,
      })
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
