import Image from "next/image";

export function AccessDenied() {
  return (
    <main className="grid min-h-[70vh] place-items-center p-5 text-center md:p-8">
      <div className="space-y-3">
        <p className="flex items-center justify-center text-9xl leading-none font-medium tracking-tighter text-primary select-none sm:text-[10rem] md:text-[12rem] lg:text-[18rem] xl:text-[18rem]">
          <span>4</span>
          <Image
            src="/assets/images/padlock.png"
            alt=""
            aria-hidden="true"
            width={512}
            height={512}
            sizes="14rem"
            className="h-[0.82em] w-auto object-contain"
          />
          <span className="xl:-ml-[2rem] lg:-ml-[1.4rem] -z-10 sm:-ml-[1rem] md:-ml-[1rem] -ml-[0.8rem]">
            3
          </span>
        </p>
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">{"Forbidden"}</h1>
          <p className="text-lg text-muted-foreground">
            Access to this resource is denied!
          </p>
        </div>
      </div>
    </main>
  );
}
