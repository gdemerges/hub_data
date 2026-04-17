'use client'

import { Terminal } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

type NeonColor = 'neon-cyan' | 'neon-magenta' | 'neon-green' | 'neon-yellow' | 'neon-orange' | 'neon-red' | 'purple-400' | 'blue-400'

const colorMap: Record<NeonColor, { text: string; border: string }> = {
  'neon-cyan':    { text: 'text-neon-cyan',    border: 'border-neon-cyan/30' },
  'neon-magenta': { text: 'text-neon-magenta', border: 'border-neon-magenta/30' },
  'neon-green':   { text: 'text-neon-green',   border: 'border-neon-green/30' },
  'neon-yellow':  { text: 'text-neon-yellow',  border: 'border-neon-yellow/30' },
  'neon-orange':  { text: 'text-neon-orange',  border: 'border-neon-orange/30' },
  'neon-red':     { text: 'text-neon-red',     border: 'border-neon-red/30' },
  'purple-400':   { text: 'text-purple-400',   border: 'border-purple-400/30' },
  'blue-400':     { text: 'text-blue-400',     border: 'border-blue-400/30' },
}

interface PageHeaderProps {
  title: string
  systemName: string
  status?: string
  statusDetail: string
  loadingMessage: string
  color: NeonColor
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  systemName,
  status = 'ONLINE',
  statusDetail,
  loadingMessage,
  color,
  actions,
}: PageHeaderProps) {
  const colors = colorMap[color]

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-bg-card border ${colors.border} rounded-lg`}>
            <Terminal className={`w-8 h-8 ${colors.text}`} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className={colors.text}>{title}</span>_{systemName}
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: {status} // {statusDetail}
            </p>
          </div>
        </div>
        {actions}
      </div>
      <div className={`font-mono text-sm text-text-secondary border-l-2 ${colors.border} pl-4`}>
        &gt; {loadingMessage}
        <span className={`${colors.text} animate-pulse`}>_</span>
      </div>
    </div>
  )
}
