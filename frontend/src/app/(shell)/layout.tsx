import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-[#f1f1ef] text-[#2d2d2d]">
      <div className="flex h-full gap-3 p-3">
        <Sidebar />
        <main className="flex flex-1 flex-col gap-3 overflow-y-auto pb-24 lg:pb-3">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
