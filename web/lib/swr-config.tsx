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
        dedupingInterval: 300000, // 5 minutes
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  )
}

// Custom hooks for API calls
export function useGitHubData(username: string) {
  return {
    key: `/api/github?username=${username}`,
  }
}

export function useGitHubContributions(username: string, year: number) {
  return {
    key: `/api/github/contributions?username=${username}&year=${year}`,
  }
}

export function useGitHubYearlyContributions(username: string) {
  return {
    key: `/api/github/yearly-contributions?username=${username}`,
  }
}

export function useSteamData() {
  return {
    key: '/api/steam',
  }
}

export function useSteamPlaytime(year: number) {
  return {
    key: `/api/steam/playtime?year=${year}`,
  }
}
