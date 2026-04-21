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
}

function make(scope?: string): Logger {
  return {
    debug: (...a) => emit('debug', scope, a),
    info: (...a) => emit('info', scope, a),
    warn: (...a) => emit('warn', scope, a),
    error: (...a) => emit('error', scope, a),
    child: (sub: string) => make(scope ? `${scope}:${sub}` : sub),
  }
}

export const logger = make()
