import { NextResponse } from "next/server";
import {
  deleteSkatersSchema,
  insertSkaterSchema,
  insertSkatersSchema,
  updateSkatersSchema,
} from "@/app/[locale]/data-grid-live/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  deleteSkatersByIds,
  insertSkaters,
  listSkaters,
  updateSkaters,
} from "@/lib/skaters-store";

export async function GET() {
  try {
    const allSkaters = listSkaters();
    return NextResponse.json(allSkaters);
  } catch (error) {
    console.error({ error });
    return NextResponse.json(
      { error: "Failed to fetch skaters" },
      { status: 500 },
    );
  }
}

// Supports both single insert and bulk insert
// Single: { name, email, ... }
// Bulk: { skaters: [{ name, email, ... }, ...] }
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body: unknown = await request.json();

    const bulkResult = insertSkatersSchema.safeParse(body);
    if (bulkResult.success) {
      const newSkaters = insertSkaters(bulkResult.data.skaters);
      return NextResponse.json({
        inserted: newSkaters.length,
        skaters: newSkaters,
      });
    }

    const singleResult = insertSkaterSchema.safeParse(body);
    if (!singleResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: singleResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const newSkater = insertSkaters([singleResult.data])[0];
    if (!newSkater) {
      return NextResponse.json(
        { error: "Failed to create skater" },
        { status: 500 },
      );
    }

    return NextResponse.json(newSkater);
  } catch (error) {
    console.error({ error });
    return NextResponse.json(
      { error: "Failed to create skater" },
      { status: 500 },
    );
  }
}

// Bulk update endpoint
// Body: { updates: [{ id, changes: { status?, style?, ... } }, ...] }
export async function PATCH(request: Request) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body: unknown = await request.json();

    const result = updateSkatersSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { updates } = result.data;
    const firstUpdate = updates.at(0);
    if (!firstUpdate) {
      return NextResponse.json(
        { error: "updates array is empty" },
        { status: 400 },
      );
    }

    const count = updateSkaters(
      updates.map((u) => ({ id: u.id, changes: u.changes })),
    );

    return NextResponse.json({ updated: count });
  } catch (error) {
    console.error({ error });
    return NextResponse.json(
      { error: "Failed to update skaters" },
      { status: 500 },
    );
  }
}

// Bulk delete endpoint
// Body: { ids: string[] }
export async function DELETE(request: Request) {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body: unknown = await request.json();

    const result = deleteSkatersSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const deleted = deleteSkatersByIds(result.data.ids);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error({ error });
    return NextResponse.json(
      { error: "Failed to delete skaters" },
      { status: 500 },
    );
  }
}
