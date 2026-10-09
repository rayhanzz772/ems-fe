import Link from "next/link";
import Image from "next/image";
import { cn } from "@/components/utils";

type SidebarLogoProps = {
  className?: string;
};

export function SidebarLogo({ className }: SidebarLogoProps) {
  return (
    <Link
      href="/dashboard"
      aria-label="Morrow home"
      className={cn(
        "group/logo flex w-full items-center gap-3 rounded-lg px-2 py-1.5",
        className,
      )}
    >
      <div className="relative flex size-8 shrink-0 items-center justify-center">
        <Image
          src="/assets/logo/logo-dark.png"
          alt="Morrow"
          width={768}
          height={796}
          sizes="32px"
          priority
          className="size-5 object-contain dark:hidden"
        />
        <Image
          src="/assets/logo/logo-white.png"
          alt="Morrow"
          width={768}
          height={796}
          sizes="32px"
          priority
          className="hidden size-5 object-contain dark:block"
        />
      </div>
      <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-foreground">
            Morrow
          </span>
        </div>
        <span className="truncate text-[11px] font-medium text-muted-foreground">
          Employee Management System
        </span>
      </div>
    </Link>
  );
}
