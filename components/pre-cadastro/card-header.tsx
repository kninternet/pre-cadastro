"use client"

import { LucideIcon } from "lucide-react"

interface CardHeaderProps {
  icon: LucideIcon
  badge: string
  title: string
  description: string
}

export function CardHeader({ icon: Icon, badge, title, description }: CardHeaderProps) {
  return (
    <div className="bg-secondary px-6 py-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-[180px] h-[180px] bg-primary/10 rounded-full" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-white/85 uppercase tracking-wider mb-2.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {badge}
        </div>
        <h1 className="font-heading text-[22px] font-extrabold text-white leading-tight">
          {title}
        </h1>
        <p className="text-sm text-white/55 mt-1.5">{description}</p>
      </div>
    </div>
  )
}
