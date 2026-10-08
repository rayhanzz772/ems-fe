import Link from "next/link";
import Image from "next/image";
import { cn } from "@/components/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link
      href="/login"
      aria-label="Morrow home"
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      <div className="relative h-6 w-6 flex">
        <Image
          src="/assets/logo/logo-dark.png"
          alt="Morrow"
          width={768}
          height={796}
          sizes="32px"
          priority
          className="size-6 object-contain dark:hidden"
        />
        <Image
          src="/assets/logo/logo-white.png"
          alt=""
          aria-hidden="true"
          width={768}
          height={796}
          sizes="32px"
          priority
          className="hidden size-6 object-contain dark:block"
        />
      </div>
    </Link>
  );
}
