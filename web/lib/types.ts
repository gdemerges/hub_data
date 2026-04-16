// Types pour les données du dashboard

// User Profile
export interface Profile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface GamePlatform {
  platform: string
  status?: string
  hoursPlayed?: number
}

export interface Game {
  id?: string
  user_id?: string
  title: string
  platform?: string // Deprecated: kept for backward compatibility
  platforms?: GamePlatform[] // New: array of platforms with individual hours
  status?: string
  hoursPlayed?: number // Total hours across all platforms
  genres?: string[]
  rating?: number
  avgRating?: number
  releaseYear?: number
  coverUrl?: string
  created_at?: string
  updated_at?: string
}

export type WatchStatus = 'to_watch' | 'watching' | 'completed' | 'abandoned'

export interface Film {
  id?: string
  user_id?: string
  title: string
  titleVO?: string
  releaseYear?: number
  rating?: number
  avgRating?: number
  runtime?: number
  genres?: string[]
  posterUrl?: string
  watchStatus?: WatchStatus
  dateAdded?: string
  dateWatched?: string
  created_at?: string
  updated_at?: string
}

export interface Series {
  id?: string
  user_id?: string
  title: string
  titleVF?: string
  status?: string
  rating?: number
  avgRating?: number
  episodesWatched?: number
  episodes?: number
  releaseYear?: number
  airingStatus?: string
  genres?: string[]
  posterUrl?: string
  watchStatus?: WatchStatus
  dateAdded?: string
  dateCompleted?: string
  created_at?: string
  updated_at?: string
}

export interface GitHubUser {
  login: string
  name: string
  avatarUrl: string
  bio: string
  publicRepos: number
  followers: number
  following: number
  createdAt: string
}

export interface GitHubRepo {
  name: string
  description: string
  language: string
  stars: number
  forks: number
  pushedAt: string
  url: string
}

export interface Book {
  id: string
  user_id?: string
  title: string
  titleVO?: string
  author?: string
  format?: string
  lectorat?: string
  genre1?: string
  genre2?: string
  editeur?: string
  collection?: string
  year?: number
  pages?: number
  langue?: string
  rating?: number // Note sur 20
  avgRating?: number // Moyenne sur 20
  dateRead?: string
  datePurchase?: string
  type?: string
  isbn?: string
  coverUrl?: string
  created_at?: string
  updated_at?: string
}

export interface DashboardStats {
  totalGames: number
  totalFilms: number
  totalSeries: number
  totalHours: number
  gamesPlayed: number
}

export interface IGDBToken {
  accessToken: string
  expiresAt: number
}

// Types pour l'analyse fitness (Sport)
export interface FitnessMetrics {
  ctl: number // Chronic Training Load (fitness long terme - 42 jours)
  atl: number // Acute Training Load (fatigue récente - 7 jours)
  tsb: number // Training Stress Balance (forme = ctl - atl)
  date: string
}

export interface RacePrediction {
  distance: number // en km
  predictedTime: number // en minutes
  currentPace: number // en min/km
  targetTime?: number // objectif utilisateur en minutes
  timeToTarget?: number // temps estimé pour atteindre l'objectif (en jours)
  confidence: number // 0-100
}

export interface RecoveryAdvice {
  status: 'ready' | 'caution' | 'rest' // prêt / attention / repos recommandé
  hoursRecommended: number
  reason: string
  riskScore: number // 0-100, 100 = risque élevé
}

export interface TrainingGoal {
  distance: number // 5, 10, 21.1, 42.2
  targetTime: number // en minutes
  createdAt: string
}

export interface PerformanceInsight {
  factor: string // 'day', 'hour', 'rest'
  label: string // 'Samedi', 'Matin', '2 jours'
  avgSpeed: number // km/h
  activityCount: number
  improvement: number // % vs moyenne globale
}

export interface PerformanceAnalysis {
  globalAvgSpeed: number
  bestDayOfWeek: PerformanceInsight
  bestTimeOfDay: PerformanceInsight
  bestRestDays: PerformanceInsight
  insights: PerformanceInsight[]
}

// API response types (shared between API routes and page components)

export interface SpotifyData {
  user: {
    name: string
    avatar: string
    followers: number
    profileUrl: string
  }
  topTracks: {
    name: string
    artist: string
    album: string
    albumCover: string
    duration: number
    previewUrl?: string
    spotifyUrl: string
  }[]
  topArtists: {
    name: string
    image: string
    genres: string[]
    followers: number
    spotifyUrl: string
  }[]
  recentlyPlayed: {
    name: string
    artist: string
    album: string
    albumCover: string
    playedAt: string
    spotifyUrl: string
  }[]
  topGenres: { genre: string; count: number }[]
  stats: {
    totalTracks: number
    totalArtists: number
    totalGenres: number
  }
  fetchedAt?: string
}

export interface GitHubData {
  user: {
    login: string
    name: string
    avatar: string
    bio: string
    location: string
    company: string
    blog: string
    publicRepos: number
    followers: number
    following: number
  }
  stats: {
    totalRepos: number
    totalStars: number
    totalForks: number
    totalContributions: number
    topLanguages: { language: string; bytes?: number; count?: number; percentage: string }[]
  }
  topRepos: {
    name: string
    description: string
    stars: number
    forks: number
    language: string
    url: string
    updatedAt?: string
  }[]
  fetchedAt?: string
}
