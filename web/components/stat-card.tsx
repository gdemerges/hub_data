import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-border-subtle rounded-2xl p-5 text-center',
        'transition-all duration-300 hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg',
        className
      )}
    >
      {Icon && (
        <div className="text-2xl mb-2 opacity-90">
          <Icon className="w-6 h-6 mx-auto text-accent-primary" />
        </div>
      )}
      <div className="text-3xl font-bold text-text-primary tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}
