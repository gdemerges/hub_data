'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableSectionProps {
  title: string
  subtitle?: string
  defaultExpanded?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function ExpandableSection({
  title,
  subtitle,
  defaultExpanded = false,
  icon,
  children,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="tech-card border-neon-cyan/30 overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-neon-cyan/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs font-mono text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <span className="text-xs font-mono text-neon-cyan">Cliquer pour voir</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neon-cyan" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neon-cyan" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-neon-cyan/20">
          <div className="pt-6">{children}</div>
        </div>
      )}
    </div>
  )
}
