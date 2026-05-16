import * as Icons from "lucide-react";

import { cn } from "@/lib/utils";

type IconProps = {
  name: string;
  className?: string;
  strokeWidth?: number;
};

export function Icon({ name, className, strokeWidth = 1.8 }: IconProps) {
  const LucideIcon = Icons[name as keyof typeof Icons] as Icons.LucideIcon | undefined;
  const Fallback = Icons.CircleDot;
  const Component = LucideIcon || Fallback;

  return <Component className={cn("size-4", className)} aria-hidden="true" strokeWidth={strokeWidth} />;
}
