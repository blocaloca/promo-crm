export type ProspectState = "prospect" | "contacted" | "in_convo" | "booked" | "dormant";
export type Channel = "linkedin_dm" | "email" | "ig_dm" | "call" | "other";
export type MsgType = "intro" | "follow_up" | "industry" | "referral" | "reengage";

export interface Prospect {
  id: string; name: string; title?: string; company?: string;
  sector?: string; region?: string; tier?: string;
  linkedin_url?: string; email?: string; phone?: string; instagram?: string;
  state: ProspectState; last_touched?: string; created_at?: string;
  south_america_relevant?: boolean; notes?: string;
}
export interface Promo {
  id: string; name: string; template_key: string; aspect_ratio?: string;
  headline?: string; body_copy?: string;
  link_url_1?: string; link_url_2?: string; contact_phone?: string;
  sector?: string[]; angle?: string; og_title?: string; og_description?: string;
  og_image_path?: string; public_token?: string; pdf_path?: string;
  view_count: number; status: string;
  brand_title?: string; logo_asset_id?: string;
}
export interface Message {
  id: string; label: string; body: string; msg_type: MsgType;
  sector?: string; channel_hint?: string;
}
export interface Asset {
  id: string; storage_path: string; thumb_path: string; filename?: string;
  width?: number; height?: number; orientation?: string;
  sector?: string[]; shoot?: string; south_america?: boolean; tags?: string[];
}
export interface ListRow { id: string; name: string; }
