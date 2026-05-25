import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/70 bg-white/88 shadow-[0_24px_60px_rgba(23,23,23,0.10)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
