'use client'

import { GithubLogo, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'

type Tab = 'github' | 'claude'

export function DevTabs({ github, claude }: { github: React.ReactNode; claude: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>('github')

  return (
    <>
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        <button
          onClick={() => setTab('github')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
            tab === 'github'
              ? 'text-earth-terracotta border-earth-terracotta'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <GithubLogo className="w-4 h-4" />
          GitHub
        </button>
        <button
          onClick={() => setTab('claude')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
            tab === 'claude'
              ? 'text-earth-fern border-earth-fern'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <Sparkle className="w-4 h-4" />
          Claude Code
        </button>
      </div>

      <div className={tab === 'github' ? 'block' : 'hidden'}>{github}</div>
      <div className={tab === 'claude' ? 'block' : 'hidden'}>{claude}</div>
    </>
  )
}
