"use client";

import { Bot, ClipboardList, Home, PlusCircle, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const items = [
  { label: "Home", icon: Home },
  { label: "Groups", icon: UserRound },
  { label: "Assign", icon: ClipboardList, active: true },
  { label: "Toolkit", icon: Bot },
];

export function MobileNav({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="fixed right-4 bottom-4 left-4 z-30 flex items-center justify-between rounded-[24px] px-4 py-3 lg:hidden">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            item.active ? "text-[#1f1f1f]" : "text-[#8a8a8a]"
          }`}
        >
          <item.icon className="size-4" />
          <span>{item.label}</span>
        </div>
      ))}
      <Button size="icon" className="size-11" onClick={onCreate}>
        <PlusCircle className="size-5" />
      </Button>
    </Card>
  );
}
