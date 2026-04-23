'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 1800000, // 30 min default; server TTLs are 1-6h so no need to re-fetch sooner
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  )
}

