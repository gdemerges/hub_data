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

export function useStravaStats(year: number | null) {
  return {
    key: year ? `/api/strava/stats?year=${year}` : '/api/strava/stats',
  }
}

export function usePartnersCount(year: number | null) {
  return {
    key: year ? `/api/partners?year=${year}` : '/api/partners',
  }
}

export function useVoyages() {
  return {
    key: '/api/voyages',
  }
}

export function useBooksData() {
  return {
    key: '/api/books',
  }
}
