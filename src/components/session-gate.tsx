import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { authOptions } from "@/lib/auth";

type Role = "SUPER_ADMIN" | "USER";

const REDIRECTS: Record<Role, { other: Role; otherTo: string; noneTo: string }> = {
  USER: { other: "SUPER_ADMIN", otherTo: "/admin", noneTo: "/login" },
  SUPER_ADMIN: { other: "USER", otherTo: "/dashboard", noneTo: "/admin/login" },
};

export async function HeaderMenus({ role }: { role: Role }) {
  const session = await getServerSession(authOptions);
  const current = session?.user?.role as Role | undefined;
  const r = REDIRECTS[role];
  if (current === r.other) redirect(r.otherTo);
  if (current !== role) redirect(r.noneTo);

  return (
    <>
      <div className="flex justify-self-end md:hidden">
        <UserMenu name={session?.user?.name ?? undefined} role={session?.user?.role} />
      </div>
      <div className="hidden md:flex md:justify-self-end">
        <UserMenu name={session?.user?.name ?? undefined} role={session?.user?.role} />
      </div>
    </>
  );
}

export async function RoleGate({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const current = session?.user?.role as Role | undefined;
  const r = REDIRECTS[role];
  if (current === r.other) redirect(r.otherTo);
  if (current !== role) redirect(r.noneTo);
  return <>{children}</>;
}
