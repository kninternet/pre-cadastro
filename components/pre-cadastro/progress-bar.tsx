"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  currentStep: number
}

const steps = [
  { id: 1, label: "Plano" },
  { id: 2, label: "Dados" },
  { id: 3, label: "Endereço" },
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full max-w-[680px] mb-6">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center font-heading text-[13px] font-bold transition-all",
                  step.id < currentStep && "border-success bg-success text-white",
                  step.id === currentStep && "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(249,115,22,0.18)]",
                  step.id > currentStep && "border-border bg-card text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="w-[13px] h-[13px]" strokeWidth={3} />
                ) : (
                  step.id
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 rounded-sm transition-colors mx-2",
                  step.id < currentStep ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex-1 text-center text-[11px] font-semibold uppercase tracking-wider",
              step.id < currentStep && "text-success",
              step.id === currentStep && "text-primary",
              step.id > currentStep && "text-muted-foreground"
            )}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  )
}
