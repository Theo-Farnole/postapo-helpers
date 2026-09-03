export const TICK_SECONDS = 9

export type Tree = {
  label: string
  baseCost: number
  goldPerTick: number
  pollution: number
}

export const TREES: Tree[] = [
  { label: 'T1', baseCost: 300, goldPerTick: 1, pollution: 1 },
  { label: 'T2', baseCost: 8_500, goldPerTick: 2, pollution: 2 },
  { label: 'T3', baseCost: 140_000, goldPerTick: 4, pollution: 3 },
  { label: 'T4', baseCost: 7_000_000, goldPerTick: 6, pollution: 4 },
]

export type TreeRow = Tree & {
  cost: number
  breakEvenTicks: number
  goldPerPollution: number
}

/** T3 is the reference tier: its price has enough digits to read the discount precisely. */
export const REFERENCE_TREE_INDEX = 2

/** 1 = full price, 0.8 = 20% global discount. */
export function priceRatio(referencePrice: number): number {
  return referencePrice / TREES[REFERENCE_TREE_INDEX].baseCost
}

export function treeRows(referencePrice: number): TreeRow[] {
  const ratio = priceRatio(referencePrice)
  return TREES.map((tree) => {
    const cost = Math.round(tree.baseCost * ratio)
    return {
      ...tree,
      cost,
      breakEvenTicks: cost / tree.goldPerTick,
      goldPerPollution: cost / tree.pollution,
    }
  })
}

export type Upgrade = {
  from: TreeRow
  to: TreeRow
  cost: number
  extraGoldPerTick: number
  extraPollution: number
  ticks: number
}

/** Upgrading pays the full price of the new tree and only gains the rate difference. */
export function upgrades(rows: TreeRow[]): Upgrade[] {
  return rows.slice(0, -1).map((from, index) => {
    const to = rows[index + 1]
    const extraGoldPerTick = to.goldPerTick - from.goldPerTick
    return {
      from,
      to,
      cost: to.cost,
      extraGoldPerTick,
      extraPollution: to.pollution - from.pollution,
      ticks: to.cost / extraGoldPerTick,
    }
  })
}

const DURATION_UNITS = [
  { label: 'y', seconds: 365 * 86_400 },
  { label: 'd', seconds: 86_400 },
  { label: 'h', seconds: 3_600 },
  { label: 'm', seconds: 60 },
  { label: 's', seconds: 1 },
]

/** Two coarsest non-zero units, e.g. "1y 148d" or "3h 12m". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) {
    return '0s'
  }
  let rest = Math.round(seconds)
  const parts: string[] = []
  for (const unit of DURATION_UNITS) {
    if (parts.length === 2) {
      break
    }
    const amount = Math.floor(rest / unit.seconds)
    if (amount > 0) {
      parts.push(`${amount}${unit.label}`)
      rest -= amount * unit.seconds
    }
  }
  return parts.join(' ')
}

export function formatGold(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
}

export function formatTicks(ticks: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    Math.ceil(ticks),
  )
}
