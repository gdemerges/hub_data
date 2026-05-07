'use client'

import { useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { syncGitHubAction } from '@/lib/github-actions'

export function GitHubSyncButton({ username }: { username: string }) {
  const [pending, startTransition] = useTransition()

  function handleSync() {
    startTransition(async () => {
      const result = await syncGitHubAction(username)
      if (!result.ok) alert('Échec de la synchronisation')
    })
  }

  return (
    <button
      onClick={handleSync}
      disabled={pending}
      aria-label="Rafraîchir les données GitHub"
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-earth-terracotta/80 border border-earth-terracotta/30 rounded-full hover:bg-earth-terracotta/10 hover:text-earth-terracotta hover:border-earth-terracotta/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Rafraîchir les données"
    >
      <RefreshCw className={`w-3 h-3 ${pending ? 'animate-spin' : ''}`} />
      SYNC
    </button>
  )
}
