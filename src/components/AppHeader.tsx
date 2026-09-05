import Image from "next/image";
import { cn } from "@/lib/utils";
import logoder from "@/assets/img/logoderbaru.jpeg";

export function AppHeader({
  badge,
  mobileNav,
  desktopNav,
  menus,
  className,
  wide,
}: {
  badge: string;
  mobileNav?: React.ReactNode;
  desktopNav: React.ReactNode;
  menus: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <header className={cn("border-b bg-[#FED6D6]", className)}>
      <div
        className={cn(
          "mx-auto grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 px-5 md:flex md:px-8",
          !wide && "max-w-5xl"
        )}
      >
        {mobileNav ? <div className="flex md:hidden">{mobileNav}</div> : null}

        <div
          className={cn(
            "flex min-w-0 items-center gap-2 md:mr-2 md:justify-self-start",
            mobileNav ? "justify-self-center" : "justify-self-start"
          )}
        >
          <Image src={logoder} alt="Logo" width={32} height={32} className="rounded-full object-cover" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-lg font-semibold">
              CuratedBy<span className="text-[#D97A7A]">Der</span>
            </span>
            <span className="truncate text-xs font-medium opacity-70">{badge}</span>
          </div>
        </div>

        <div className="hidden md:flex md:flex-1 md:justify-center">{desktopNav}</div>

        {menus}
      </div>
    </header>
  );
}
