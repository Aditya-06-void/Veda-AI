import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-full border border-black/8 bg-white px-4 text-sm text-[#222] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none placeholder:text-[#999] focus:border-black/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
