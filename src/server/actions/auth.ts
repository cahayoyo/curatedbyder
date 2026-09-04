"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.csrf-token",
  "__Secure-next-auth.callback-url",
];

export async function customSignOut() {
  const store = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    store.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Secure-"),
    });
  }
}