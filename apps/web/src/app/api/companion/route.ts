import {
  claimPetGift,
  claimStarterEgg,
  feedCompanion,
  getCompanionSnapshot,
  moveGardenItem,
  moveGardenNest,
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
      | "move_nest"
      | "remove";
    speciesId?: string;
    itemId?: string;
    giftId?: string;
    placementId?: string;
    x?: number;
    y?: number;
    layer?: "background" | "middle" | "foreground";
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
    if (
      !body.itemId ||
      typeof body.x !== "number" ||
      typeof body.y !== "number"
    ) {
      return NextResponse.json(
        { error: "itemId, x, and y required" },
        { status: 400 },
      );
    }
    const result = await placeGardenItem(
      userId,
      body.itemId,
      body.x,
      body.y,
      body.layer,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "move") {
    if (
      !body.placementId ||
      typeof body.x !== "number" ||
      typeof body.y !== "number"
    ) {
      return NextResponse.json(
        { error: "placementId, x, and y required" },
        { status: 400 },
      );
    }
    const result = await moveGardenItem(
      userId,
      body.placementId,
      body.x,
      body.y,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (body.action === "move_nest") {
    if (typeof body.x !== "number" || typeof body.y !== "number") {
      return NextResponse.json({ error: "x and y required" }, { status: 400 });
    }
    const result = await moveGardenNest(userId, body.x, body.y);
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
