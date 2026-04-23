'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-neon-red/60" />
          <p className="text-sm font-mono text-text-muted">
            {this.props.label ?? 'Une erreur est survenue'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs font-mono text-neon-cyan hover:text-neon-cyan/80 underline"
          >
            Réessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
