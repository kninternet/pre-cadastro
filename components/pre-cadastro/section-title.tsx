"use client"

interface SectionTitleProps {
  children: React.ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-muted">
      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <h3 className="font-heading text-[13px] font-bold uppercase tracking-wider text-foreground">
        {children}
      </h3>
    </div>
  )
}
