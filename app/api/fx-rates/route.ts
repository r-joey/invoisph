import { NextResponse } from "next/server";
import { getLatestFXRates } from "@/lib/services/fx";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency")?.toUpperCase();

    const fxData = await getLatestFXRates();

    if (currency) {
      const rate = fxData.ratesToPHP[currency] || 1.0;
      return NextResponse.json(
        {
          currency,
          rateToPHP: rate,
          date: fxData.date,
          source: fxData.source,
          bspCompliant: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    return NextResponse.json(fxData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Failed to retrieve FX rates", message: err.message },
      { status: 500 }
    );
  }
}
