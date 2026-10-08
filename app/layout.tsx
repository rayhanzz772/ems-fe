import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morrow | Your workspace, in focus",
  description: "Sign in or create your Morrow account.",
  icons: {
    icon: "/assets/logo/logo-dark.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        plusJakartaSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-svh">
        <Providers>
          <SidebarProvider>
            <div className="flex min-h-svh w-full">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <div className="flex-1">{children}</div>
              </div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
