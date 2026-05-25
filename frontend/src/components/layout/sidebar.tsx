"use client";

import {
  Bot,
  ClipboardList,
  Grid2X2,
  Library,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { schoolProfile } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAssignmentStore } from "@/store/use-assignment-store";

const navItems = [
  { label: "Home", icon: Grid2X2, href: "/home" },
  { label: "My Groups", icon: Users, href: "/groups" },
  { label: "Assignments", icon: ClipboardList, href: "/assignments", badge: true },
  { label: "AI Teacher's Toolkit", icon: Bot, href: "/toolkit" },
  { label: "My Library", icon: Library, href: "/library" },
];

export function Sidebar({ assignmentCount = 10 }: { assignmentCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setView, setNav } = useAssignmentStore();

  function handleCreate() {
    setView("create");
    setNav("assignments");
    router.push("/assignments");
  }

  return (
    <Card className="hidden h-full w-65 flex-none flex-col justify-between overflow-y-auto rounded-[26px] px-4 py-5 lg:flex">
      <div className="space-y-8">
        <Link href="/home" className="flex items-center gap-3 px-2">
          <Image
            src="/logo.avif"
            alt="VedaAI logo"
            width={40}
            height={40}
            className="rounded-2xl shadow-md"
            unoptimized
          />
          <div className="text-[19px] font-extrabold text-[#292929]">VedaAI</div>
        </Link>

        <Button
          onClick={handleCreate}
          className="h-13 w-full justify-start rounded-full border-4 border-[#f57f57] bg-[#2a2a2a] px-6 text-[15px]"
        >
          <Sparkles className="size-4" />
          Create Assignment
        </Button>

        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] text-[#7b7b7b] transition-colors hover:bg-[#f3f3f3] hover:text-[#2d2d2d]",
                  active && "bg-[#f3f3f3] font-semibold text-[#2d2d2d]",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-4.5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && assignmentCount > 0 ? (
                  <span className="rounded-full bg-[#ff6f2c] px-2 py-0.5 text-[11px] font-bold text-white">
                    {assignmentCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <Link href="/settings" className="flex items-center gap-3 px-4 text-[#7b7b7b] hover:text-[#2d2d2d] transition-colors">
          <Settings className="size-4.5" />
          <span>Settings</span>
        </Link>
        <div className="rounded-[20px] bg-[#f5f5f5] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#ffd8c4] text-sm font-black text-[#2d2d2d]">
              {schoolProfile.avatarText}
            </div>
            <div>
              <div className="font-bold text-[#2d2d2d]">{schoolProfile.schoolName}</div>
              <div className="text-sm text-[#7b7b7b]">{schoolProfile.campus}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
