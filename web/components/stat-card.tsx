'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
  color?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'purple'
}

const colorClasses = {
  cyan: {
    icon: 'text-neon-cyan',
    glow: 'shadow-[0_0_15px_rgba(0,255,255,0.3)]',
    border: 'border-neon-cyan/30 hover:border-neon-cyan/60',
    value: 'text-neon-cyan',
  },
  magenta: {
    icon: 'text-neon-magenta',
    glow: 'shadow-[0_0_15px_rgba(255,0,255,0.3)]',
    border: 'border-neon-magenta/30 hover:border-neon-magenta/60',
    value: 'text-neon-magenta',
  },
  green: {
    icon: 'text-neon-green',
    glow: 'shadow-[0_0_15px_rgba(0,255,136,0.3)]',
    border: 'border-neon-green/30 hover:border-neon-green/60',
    value: 'text-neon-green',
  },
  yellow: {
    icon: 'text-neon-yellow',
    glow: 'shadow-[0_0_15px_rgba(255,255,0,0.3)]',
    border: 'border-neon-yellow/30 hover:border-neon-yellow/60',
    value: 'text-neon-yellow',
  },
  orange: {
    icon: 'text-neon-orange',
    glow: 'shadow-[0_0_15px_rgba(255,136,0,0.3)]',
    border: 'border-neon-orange/30 hover:border-neon-orange/60',
    value: 'text-neon-orange',
  },
  red: {
    icon: 'text-neon-red',
    glow: 'shadow-[0_0_15px_rgba(255,0,0,0.3)]',
    border: 'border-neon-red/30 hover:border-neon-red/60',
    value: 'text-neon-red',
  },
  blue: {
    icon: 'text-blue-400',
    glow: 'shadow-[0_0_15px_rgba(96,165,250,0.3)]',
    border: 'border-blue-400/30 hover:border-blue-400/60',
    value: 'text-blue-400',
  },
  purple: {
    icon: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(192,132,252,0.3)]',
    border: 'border-purple-400/30 hover:border-purple-400/60',
    value: 'text-purple-400',
  },
}

export function StatCard({ label, value, icon: Icon, className, color = 'cyan' }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div
      className={cn(
        'tech-card p-5 text-center group',
        'transition-all duration-300 hover:-translate-y-1',
        colors.border,
        'hover:' + colors.glow,
        className
      )}
    >
      {/* Corner decorations are handled by tech-card class */}

      {Icon && (
        <div className="mb-3">
          <div className={cn(
            'w-12 h-12 mx-auto rounded-lg flex items-center justify-center',
            'bg-bg-tertiary border border-current/20',
            colors.icon
          )}>
            <Icon className={cn(
              'w-6 h-6 transition-all duration-300',
              'group-hover:drop-shadow-[0_0_8px_currentColor]'
            )} />
          </div>
        </div>
      )}

      <div className={cn(
        'font-mono text-3xl font-bold tracking-tight',
        'transition-all duration-300',
        colors.value,
        'group-hover:neon-text-subtle'
      )}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="w-2 h-px bg-current opacity-50" />
        <span className="text-xs font-mono text-text-muted uppercase tracking-widest">
          {label}
        </span>
        <span className="w-2 h-px bg-current opacity-50" />
      </div>
    </div>
  )
}
