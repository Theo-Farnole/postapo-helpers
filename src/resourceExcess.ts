export const TICK = 1200
export const AD_BONUS_RATE = 0.5

export function parseNumber(value: string): number | null {
  const trimmed = stripGrouping(value).replace(',', '.')
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function stripGrouping(value: string): string {
  return value.trim().replace(/[\s\u00A0\u202F\u2009]/g, '')
}

/** Group integer digits with spaces, e.g. 800000000 → "800 000 000". */
export function formatGroupedInput(value: string): string {
  const compact = stripGrouping(value)
  if (compact === '') {
    return ''
  }

  const negative = compact.startsWith('-')
  const unsigned = negative ? compact.slice(1) : compact
  const decimalSep = unsigned.includes(',') && !unsigned.includes('.') ? ',' : '.'
  const [rawInt = '', ...rawFrac] = unsigned.replace(',', '.').split('.')
  const intDigits = rawInt.replace(/\D/g, '')
  const hasDecimal = unsigned.includes('.') || unsigned.includes(',')
  const fracDigits = rawFrac.join('').replace(/\D/g, '')
  const groupedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const sign = negative ? '-' : ''

  if (!hasDecimal) {
    return `${sign}${groupedInt}`
  }
  return `${sign}${groupedInt}${decimalSep}${fracDigits}`
}

export function groupedInputCaret(
  formatted: string,
  significantBeforeCaret: number,
): number {
  if (significantBeforeCaret <= 0) {
    return formatted.startsWith('-') ? 1 : 0
  }
  let seen = 0
  for (let i = 0; i < formatted.length; i += 1) {
    if (!/[\s\u00A0\u202F\u2009]/.test(formatted[i])) {
      seen += 1
      if (seen === significantBeforeCaret) {
        return i + 1
      }
    }
  }
  return formatted.length
}

export type IdlePayout = {
  idleGain: number
  room: number
  filled: number
  adBonus: number
  total: number
  overflow: number
}

/**
 * Excel: C + min(R*T, M-C) + min(R*T, max(M-C, 0)) * 0.5
 */
export function idlePayout(
  c: number,
  r: number,
  m: number,
  t = TICK,
): IdlePayout {
  const idleGain = r * t
  const room = m - c
  const filled = Math.min(idleGain, room)
  const adBonus = Math.min(idleGain, Math.max(room, 0)) * AD_BONUS_RATE
  const total = c + filled + adBonus
  return {
    idleGain,
    room,
    filled,
    adBonus,
    total,
    overflow: total - m,
  }
}

/** C in [0, M] that maximizes idle + ad. Peak is M − R×T. */
export function optimumC(r: number, m: number, t = TICK): number {
  if (m <= 0) {
    return 0
  }
  return Math.min(m, Math.max(0, m - r * t))
}

/** Smallest C in [0, M] where total exceeds M. */
export function exceedCapC(r: number, m: number, t = TICK): number {
  if (m <= 0) {
    return 0
  }
  return Math.min(m, Math.max(0, m - r * t * (1 + AD_BONUS_RATE)))
}

function curvePoint(c: number, r: number, m: number, t = TICK) {
  const payout = idlePayout(c, r, m, t)
  return {
    c,
    total: payout.total,
    earned: payout.filled + payout.adBonus,
  }
}

export function sampleCurve(
  r: number,
  m: number,
  t = TICK,
  points = 160,
): { c: number; total: number; earned: number }[] {
  const maxC = Math.max(m, 0)
  const peak = optimumC(r, m, t)
  const exceed = exceedCapC(r, m, t)
  const xs = new Set<number>([0, exceed, peak, maxC])

  if (maxC === 0) {
    return [curvePoint(0, r, m, t)]
  }

  for (let i = 0; i <= points; i += 1) {
    xs.add((i / points) * maxC)
  }

  return [...xs]
    .sort((a, b) => a - b)
    .map((c) => curvePoint(c, r, m, t))
}
