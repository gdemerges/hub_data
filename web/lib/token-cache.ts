import { logger } from './logger'

/** In-memory OAuth token cache. One instance per API client. */
export class TokenCache {
  private cached: { token: string; expiresAt: number } | null = null
  private readonly label: string

  constructor(label = 'token') {
    this.label = label
  }

  /** Returns the token if still valid (with 60s buffer), null otherwise. */
  get(): string | null {
    if (this.cached && Date.now() < this.cached.expiresAt - 60_000) {
      logger.metric('cache.hit', { cache: this.label })
      return this.cached.token
    }
    logger.metric('cache.miss', {
      cache: this.label,
      reason: this.cached ? 'expired' : 'absent',
    })
    return null
  }

  set(token: string, expiresInSeconds: number): void {
    this.cached = { token, expiresAt: Date.now() + expiresInSeconds * 1000 }
  }
}
