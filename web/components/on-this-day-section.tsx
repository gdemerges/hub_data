import Link from 'next/link'
import { CalendarHeart, Film, Gamepad2, BookOpen, type LucideIcon } from 'lucide-react'
import { SectionCard } from './section-card'
import { ACCENTS } from '@/lib/accents'
import type { OnThisDayEvent, OnThisDayType } from '@/lib/on-this-day'

interface OnThisDaySectionProps {
  events: OnThisDayEvent[]
}

const TYPE_ICON: Record<OnThisDayType, LucideIcon> = {
  film: Film,
  game: Gamepad2,
  book: BookOpen,
}

const TYPE_HREF: Record<OnThisDayType, string> = {
  film: '/films',
  game: '/games',
  book: '/books',
}

function agoLabel(yearsAgo: number): string {
  if (yearsAgo === 0) return "Aujourd'hui"
  if (yearsAgo === 1) return 'Il y a un an'
  return `Il y a ${yearsAgo} ans`
}

export function OnThisDaySection({ events }: OnThisDaySectionProps) {
  if (events.length === 0) return null

  // Regroupe par ancienneté (déjà triés du plus récent au plus ancien).
  const groups: { yearsAgo: number; year: number; items: OnThisDayEvent[] }[] = []
  for (const e of events) {
    const last = groups[groups.length - 1]
    if (last && last.yearsAgo === e.yearsAgo) last.items.push(e)
    else groups.push({ yearsAgo: e.yearsAgo, year: e.year, items: [e] })
  }

  return (
    <SectionCard title="Ce jour-là" icon={CalendarHeart} accent="terracotta">
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.yearsAgo} className="flex flex-col sm:flex-row sm:gap-6">
            <div className="sm:w-32 shrink-0 mb-2 sm:mb-0">
              <p className="text-sm font-medium text-text-primary">{agoLabel(group.yearsAgo)}</p>
              <p className="text-[11px] num text-text-muted">{group.year}</p>
            </div>
            <ul className="flex flex-wrap gap-2 flex-1">
              {group.items.map((e, i) => {
                const Icon = TYPE_ICON[e.type]
                const rgb = ACCENTS[e.accent].accent
                return (
                  <li key={`${e.type}-${e.title}-${i}`}>
                    <Link
                      href={TYPE_HREF[e.type]}
                      title={e.subtitle ? `${e.title} — ${e.subtitle}` : e.title}
                      className="group flex items-center gap-2 rounded-full border border-border-subtle bg-bg-primary pl-2 pr-3 py-1.5 transition-colors hover:[border-color:rgb(var(--c)/0.5)]"
                      style={{ ['--c' as string]: rgb }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(${rgb})` }} strokeWidth={1.75} />
                      <span className="text-xs text-text-secondary max-w-[180px] truncate group-hover:text-text-primary transition-colors">
                        {e.title}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
