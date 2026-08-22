"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NavActionButton({
  href,
  icon,
  children,
  className,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function go() {
    setLoading(true);
    router.push(href);
  }

  return (
    <Button
      type="button"
      onClick={go}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-current" />
      ) : (
        icon
      )}
      {children}
    </Button>
  );
}