"use client";

import { Bot, ClipboardList, Grid2X2, Library, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", icon: Grid2X2, key: "home" },
  { label: "Assignments", icon: ClipboardList, key: "assignments" },
  { label: "Library", icon: Library, key: "library" },
  { label: "AI Toolkit", icon: Bot, key: "toolkit" },
];

export function MobileNav({
  onCreate,
  active,
}: {
  onCreate: () => void;
  active: "assignments" | "toolkit";
}) {
  return (
    <>
      <Button
        size="icon"
        className="fixed right-4 bottom-28 z-30 size-13 rounded-full bg-white text-[#ff6f2c] shadow-[0_10px_32px_rgba(17,17,17,0.18)] lg:hidden"
        onClick={onCreate}
      >
        <PlusCircle className="size-6" />
      </Button>
      <Card className="fixed right-4 bottom-4 left-4 z-30 flex items-center justify-between rounded-[24px] bg-[#1f1f1f] px-5 py-4 text-white lg:hidden">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] text-[#767676]",
            item.key === active && "text-white",
          )}
        >
          <item.icon className="size-4" />
          <span>{item.label}</span>
        </div>
      ))}
      </Card>
    </>
  );
}
