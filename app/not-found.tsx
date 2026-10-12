import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center p-5 text-center md:p-8">
      <div className="space-y-3">
        <p className="flex items-center justify-center text-9xl leading-none font-medium tracking-tighter text-primary select-none sm:text-[10rem] md:text-[12rem] lg:text-[16rem]">
          <span>4</span>
          <SearchX
            aria-hidden="true"
            strokeWidth={1.5}
            className="h-[0.62em] w-auto"
          />
          <span>4</span>
        </p>
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">
            Page not found
          </h1>
          <p className="text-lg text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Button nativeButton={false} render={<Link href="/dashboard" />}>Back to dashboard</Button>
        </div>
      </div>
    </main>
  );
}
