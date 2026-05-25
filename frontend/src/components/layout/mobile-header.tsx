"use client";

import { Bell, ChevronLeft, Lock, Menu, Share, UserCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";

export function MobileHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="space-y-3 md:hidden">
      <div className="-mx-4 -mt-4 bg-[#3a3a3a] px-4 pt-4 pb-3 text-white">
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <span>•••</span>
            <span>▰</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-full bg-[#686c74] px-4 py-3">
          <Lock className="size-4" />
          <span className="flex-1 text-center text-sm">web-to-figma.design</span>
          <Share className="size-4" />
        </div>
      </div>

      <Card className="rounded-[24px] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[17px] font-extrabold text-[#2d2d2d]">VedaAI</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="size-5 text-[#2d2d2d]" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#ff6f2c]" />
            </div>
            <UserCircle2 className="size-8 text-[#2d2d2d]" />
            <Menu className="size-5 text-[#2d2d2d]" />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4 px-1 py-1">
        <button className="flex size-12 items-center justify-center rounded-full bg-white/70">
          <ChevronLeft className="size-5 text-[#333]" />
        </button>
        <div className="text-[20px] font-bold text-[#2d2d2d]">{title}</div>
      </div>
    </div>
  );
}
