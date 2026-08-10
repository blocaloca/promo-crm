"use server";

import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { Channel } from "@/lib/types";

export async function logInteraction(input: {
  prospectId: string;
  promoId: string | null;
  messageId: string | null;
  channel: Channel;
  note: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO interactions (org_id, owner_id, prospect_id, promo_id, message_id, channel, direction, note)
    VALUES (${ORG_ID}, ${OWNER_ID}, ${input.prospectId}, ${input.promoId}, ${input.messageId},
      ${input.channel}, 'outbound', ${input.note})
  `;
}
