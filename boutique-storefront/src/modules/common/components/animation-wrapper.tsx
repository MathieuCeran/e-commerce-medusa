"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

type AnimationType = "none" | "fade" | "slide-up" | "slide-left" | "slide-right"

type AnimationWrapperProps = {
  children: ReactNode
  animation?: AnimationType
  duration?: number
  delay?: number
  className?: string
}

export const AnimationWrapper = ({
  children,
  animation = "none",
  duration = 0.5,
  delay = 0,
  className = "",
}: AnimationWrapperProps) => {
  if (!animation || animation === "none") {
    return <div className={className}>{children}</div>
  }

  const variants = {
    hidden: {
      opacity: 0,
      y: animation === "slide-up" ? 50 : 0,
      x: animation === "slide-left" ? 50 : animation === "slide-right" ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      // @ts-expect-error // TODO: fix upstream type — framer-motion Variants ease type mismatch
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
