type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const THRESHOLD = LEVELS[(process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')]
const PRETTY = process.env.NODE_ENV !== 'production'

function serializeArg(arg: unknown): unknown {
  if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack }
  return arg
}

function format(level: Level, scope: string | undefined, args: unknown[]): string {
  const [first, ...rest] = args
  let msg: string
  let data: Record<string, unknown> = {}

  if (typeof first === 'string') {
    msg = first
    if (rest.length) data.extra = rest.map(serializeArg)
  } else {
    msg = ''
    data = { payload: args.map(serializeArg) }
  }

  const record = {
    time: new Date().toISOString(),
    level,
    ...(scope && { scope }),
    msg,
    ...data,
  }

  if (PRETTY) {
    const colors: Record<Level, string> = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' }
    const reset = '\x1b[0m'
    const tag = scope ? `[${scope}] ` : ''
    const extra = Object.keys(data).length ? ' ' + JSON.stringify(data) : ''
    return `${colors[level]}${level.toUpperCase()}${reset} ${tag}${msg}${extra}`
  }
  return JSON.stringify(record)
}

function emit(level: Level, scope: string | undefined, args: unknown[]): void {
  if (LEVELS[level] < THRESHOLD) return
  const line = format(level, scope, args)
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  child: (scope: string) => Logger
  /** Increment a named counter and emit a metric event. */
  metric: (name: string, tags?: Record<string, string | number | boolean>) => void
}

const counters = new Map<string, number>()

function metricKey(name: string, tags?: Record<string, string | number | boolean>): string {
  if (!tags) return name
  const parts = Object.keys(tags).sort().map((k) => `${k}=${tags[k]}`)
  return `${name}{${parts.join(',')}}`
}

function emitMetric(name: string, tags: Record<string, string | number | boolean> | undefined): void {
  const key = metricKey(name, tags)
  const value = (counters.get(key) ?? 0) + 1
  counters.set(key, value)
  emit('debug', 'metric', [{ metric: name, ...(tags ?? {}), count: value }])
}

/** Returns a snapshot of all counters seen so far (debug endpoint friendly). */
export function getMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters)
}

function make(scope?: string): Logger {
  return {
    debug: (...a) => emit('debug', scope, a),
    info: (...a) => emit('info', scope, a),
    warn: (...a) => emit('warn', scope, a),
    error: (...a) => emit('error', scope, a),
    child: (sub: string) => make(scope ? `${scope}:${sub}` : sub),
    metric: (name, tags) => emitMetric(name, tags),
  }
}

export const logger = make()
