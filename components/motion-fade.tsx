"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

type MotionFadeProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function MotionFade({ children, className, delay = 0 }: MotionFadeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
