declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties } from 'react'

  interface GeographyRecord {
    rsmKey: string
    properties: { name: string; [key: string]: unknown }
    [key: string]: unknown
  }

  interface GeographiesChildProps {
    geographies: GeographyRecord[]
  }

  interface GeographyStyle {
    default?: CSSProperties
    hover?: CSSProperties
    pressed?: CSSProperties
  }

  export function ComposableMap(props: {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    className?: string
    children?: ReactNode
  }): JSX.Element

  export function Geographies(props: {
    geography: string
    children: (props: GeographiesChildProps) => ReactNode
  }): JSX.Element

  export function Geography(props: {
    geography?: unknown
    fill?: string
    stroke?: string
    strokeWidth?: number
    filter?: string
    style?: GeographyStyle
    children?: ReactNode
    [key: string]: unknown
  }): JSX.Element

  export function ZoomableGroup(props: {
    [key: string]: unknown
    children?: ReactNode
  }): JSX.Element

  export function Marker(props: {
    coordinates?: [number, number]
    children?: ReactNode
    [key: string]: unknown
  }): JSX.Element
}
