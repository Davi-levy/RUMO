import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children, subtle = false }: { children: ReactNode; subtle?: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: subtle ? 0.95 : 0, y: subtle ? 4 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: subtle ? 0.95 : 0, y: subtle ? -2 : -10 }}
      transition={{ duration: reducedMotion ? 0 : subtle ? 0.18 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

