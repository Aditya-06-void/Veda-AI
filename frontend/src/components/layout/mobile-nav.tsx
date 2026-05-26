"use client";

import { Bot, ClipboardList, Grid2X2, Library, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAssignmentStore } from "@/store/use-assignment-store";

const items = [
  { label: "Home", icon: Grid2X2, href: "/home" },
  { label: "Assignments", icon: ClipboardList, href: "/assignments" },
  { label: "Library", icon: Library, href: "/library" },
  { label: "AI Toolkit", icon: Bot, href: "/toolkit" },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setView, setNav } = useAssignmentStore();

  function handleCreate() {
    setView("create");
    setNav("assignments");
    router.push("/assignments");
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed right-4 z-30 size-13 rounded-full bg-white text-[#ff6f2c] shadow-[0_10px_32px_rgba(17,17,17,0.18)] lg:hidden"
        style={{ bottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={handleCreate}
      >
        <PlusCircle className="size-6" />
      </Button>
      <Card
        className="fixed right-4 left-4 z-30 flex items-center justify-between rounded-3xl bg-[#1f1f1f] px-5 text-white lg:hidden"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))", paddingTop: "1rem", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[11px] text-[#767676] transition-colors",
                active && "text-white",
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </Card>
    </>
  );
}
