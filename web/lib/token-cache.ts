/** In-memory OAuth token cache. One instance per API client. */
export class TokenCache {
  private cached: { token: string; expiresAt: number } | null = null

  /** Returns the token if still valid (with 60s buffer), null otherwise. */
  get(): string | null {
    if (this.cached && Date.now() < this.cached.expiresAt - 60_000) {
      return this.cached.token
    }
    return null
  }

  set(token: string, expiresInSeconds: number): void {
    this.cached = { token, expiresAt: Date.now() + expiresInSeconds * 1000 }
  }
}
