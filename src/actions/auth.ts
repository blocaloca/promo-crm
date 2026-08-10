"use server";

import { scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  createSessionCookieValue,
  sessionCookieOptions,
} from "@/lib/session";

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hash = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, salt, hash.length);
  return hash.length === candidate.length && timingSafeEqual(hash, candidate);
}

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const password = String(formData.get("password") ?? "");
  const stored = process.env.APP_PASSWORD_HASH;
  if (!stored || !verifyPassword(password, stored)) {
    return { error: "Incorrect password" };
  }
  cookies().set(SESSION_COOKIE_NAME, await createSessionCookieValue(), sessionCookieOptions);
  redirect("/");
}

export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
