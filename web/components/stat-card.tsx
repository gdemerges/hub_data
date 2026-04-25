import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
  color?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'purple'
  href?: string
}

const colorClasses = {
  cyan:    { icon: 'text-earth-fern',       border: 'border-earth-fern/30',       value: 'text-earth-fern' },
  magenta: { icon: 'text-earth-terracotta', border: 'border-earth-terracotta/30', value: 'text-earth-terracotta' },
  green:   { icon: 'text-earth-moss',       border: 'border-earth-moss/30',       value: 'text-earth-moss' },
  yellow:  { icon: 'text-earth-saffron',    border: 'border-earth-saffron/30',    value: 'text-earth-saffron' },
  orange:  { icon: 'text-earth-rust',       border: 'border-earth-rust/30',       value: 'text-earth-rust' },
  red:     { icon: 'text-earth-clay',       border: 'border-earth-clay/30',       value: 'text-earth-clay' },
  blue:    { icon: 'text-earth-indigo',     border: 'border-earth-indigo/30',     value: 'text-earth-indigo' },
  purple:  { icon: 'text-earth-sage',       border: 'border-earth-sage/40',       value: 'text-earth-sage' },
}

export function StatCard({ label, value, icon: Icon, className, color = 'cyan', href }: StatCardProps) {
  const colors = colorClasses[color]

  const content = (
    <>
      {Icon && (
        <div className="mb-3">
          <div className={cn(
            'w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-bg-secondary',
            colors.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      )}

      <div className={cn('font-display text-3xl font-medium tracking-tight num', colors.value)}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>

      <div className="mt-1.5 text-xs text-text-muted">
        {label}
      </div>
    </>
  )

  const cardClasses = cn(
    'tech-card p-5 text-center group',
    href && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    )
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  )
}
