"use client";

import { Bell, ChevronDown, ChevronLeft, LayoutGrid } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { schoolProfile } from "@/lib/constants";

export function Topbar({
  title,
}: {
  title: string;
}) {
  return (
    <Card className="flex h-14 items-center justify-between rounded-[22px] px-6 py-0">
      <div className="flex items-center gap-3 text-[#aaaaaa]">
        <ChevronLeft className="size-5 text-[#2f2f2f]" />
        <LayoutGrid className="size-4" />
        <span className="text-sm font-semibold text-[#a2a2a2]">{title}</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative">
          <Bell className="size-5 text-[#2f2f2f]" />
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#ff6f2c]" />
        </div>
        <div className="flex items-center gap-3">
          <Avatar initials={schoolProfile.avatarText} className="size-10" />
          <span className="text-sm font-bold text-[#2b2b2b]">
            {schoolProfile.teacher}
          </span>
          <ChevronDown className="size-4 text-[#444]" />
        </div>
      </div>
    </Card>
  );
}
