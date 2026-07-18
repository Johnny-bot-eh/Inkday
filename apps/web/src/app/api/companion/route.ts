import {
  claimPetGift,
  claimStarterEgg,
  feedCompanion,
  getCompanionSnapshot,
  moveGardenItem,
  petCompanion,
  placeGardenItem,
  removeGardenItem,
} from "@/lib/pet-service";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = await getCompanionSnapshot(session.user.id);
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = (await req.json()) as {
    action?:
      | "claim_starter"
      | "pet"
      | "feed"
      | "claim_gift"
      | "place"
      | "move"
      | "remove";
    speciesId?: string;
    itemId?: string;
    giftId?: string;
    placementId?: string;
    cellIndex?: number;
  };

  if (body.action === "claim_starter") {
    if (!body.speciesId) {
      return NextResponse.json({ error: "speciesId required" }, { status: 400 });
    }
    const result = await claimStarterEgg(userId, body.speciesId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "pet") {
    const result = await petCompanion(userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "feed") {
    if (!body.itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }
    const result = await feedCompanion(userId, body.itemId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "claim_gift") {
    if (!body.giftId) {
      return NextResponse.json({ error: "giftId required" }, { status: 400 });
    }
    const result = await claimPetGift(userId, body.giftId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "place") {
    if (!body.itemId || typeof body.cellIndex !== "number") {
      return NextResponse.json(
        { error: "itemId and cellIndex required" },
        { status: 400 },
      );
    }
    const result = await placeGardenItem(userId, body.itemId, body.cellIndex);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "move") {
    if (!body.placementId || typeof body.cellIndex !== "number") {
      return NextResponse.json(
        { error: "placementId and cellIndex required" },
        { status: 400 },
      );
    }
    const result = await moveGardenItem(
      userId,
      body.placementId,
      body.cellIndex,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "remove") {
    if (!body.placementId) {
      return NextResponse.json(
        { error: "placementId required" },
        { status: 400 },
      );
    }
    const result = await removeGardenItem(userId, body.placementId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
