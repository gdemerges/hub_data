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
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-neon-magenta/70 border border-neon-magenta/30 rounded hover:bg-neon-magenta/10 hover:text-neon-magenta transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Rafraîchir les données"
    >
      <RefreshCw className={`w-3 h-3 ${pending ? 'animate-spin' : ''}`} />
      SYNC
    </button>
  )
}
