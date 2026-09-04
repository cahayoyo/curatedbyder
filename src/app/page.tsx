import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <SessionRedirect />
    </Suspense>
  );
}

export async function SessionRedirect() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  redirect("/login");
  return null;
}
