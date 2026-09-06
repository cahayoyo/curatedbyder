import { requireRole } from "@/lib/session";
import { UserRound } from "lucide-react";

export default async function ProfilePage() {
  const session = await requireRole("USER");

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <UserRound className="h-6 w-6 text-[#D97A7A]" />
        Profile
      </h2>
      <p className="text-muted-foreground">
        Login sebagai <span className="font-semibold text-foreground">{session.user.name}</span>
      </p>
    </div>
  );
}
