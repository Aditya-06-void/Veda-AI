import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#ffd2b3,_#f3b679_45%,_#1d1d1d_46%,_#2a2a2a_100%)] text-sm font-bold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}
