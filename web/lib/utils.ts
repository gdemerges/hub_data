import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatHours(hours: number): string {
  if (hours >= 1000) {
    return `${(hours / 1000).toFixed(1)}k`
  }
  return hours.toString()
}

export function getInitials(title: string): string {
  return title.slice(0, 2).toUpperCase()
}
