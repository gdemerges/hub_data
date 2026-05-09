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
    <div className="tech-card border-earth-fern/30 overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-earth-fern/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs font-mono text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <span className="text-xs font-mono text-earth-fern">Cliquer pour voir</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-earth-fern" />
          ) : (
            <ChevronDown className="w-5 h-5 text-earth-fern" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-earth-fern/20">
          <div className="pt-6">{children}</div>
        </div>
      )}
    </div>
  )
}
