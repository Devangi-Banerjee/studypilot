import { NextResponse } from "next/server";
import { handle, requireUserId } from "@/lib/api";
import { replan } from "@/lib/plan";

export const POST = handle(async () => {
  const userId = await requireUserId();
  const plan = await replan(userId);
  return NextResponse.json({ scheduledBlocks: plan.blocks.length, unscheduled: plan.unscheduled });
});