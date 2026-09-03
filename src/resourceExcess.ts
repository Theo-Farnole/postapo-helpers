export const TICK = 1200
export const AD_BONUS_RATE = 0.5

export function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
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

export function sampleCurve(
  r: number,
  m: number,
  t = TICK,
  points = 160,
): { c: number; y: number }[] {
  const maxC = Math.max(m, 0)
  const peak = optimumC(r, m, t)
  const exceed = exceedCapC(r, m, t)
  const xs = new Set<number>([0, exceed, peak, maxC])

  if (maxC === 0) {
    return [{ c: 0, y: idlePayout(0, r, m, t).total }]
  }

  for (let i = 0; i <= points; i += 1) {
    xs.add((i / points) * maxC)
  }

  return [...xs]
    .sort((a, b) => a - b)
    .map((c) => ({ c, y: idlePayout(c, r, m, t).total }))
}
