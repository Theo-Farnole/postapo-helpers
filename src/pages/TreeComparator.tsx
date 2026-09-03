import { useEffect, useMemo, useState } from 'react'
import tree1Icon from '../assets/resources/Tree1.webp'
import tree2Icon from '../assets/resources/Tree2.webp'
import tree3Icon from '../assets/resources/Tree3.webp'
import tree4Icon from '../assets/resources/Tree4.webp'
import { loadStored, saveStored } from '../localStore'
import { parseNumber } from '../resourceExcess'
import {
  REFERENCE_TREE_INDEX,
  TICK_SECONDS,
  TREES,
  formatDuration,
  formatGold,
  formatTicks,
  priceRatio,
  treeRows,
  upgrades,
} from '../treeCompare'
import './TreeComparator.css'

const TOOL = 'treecomparator'
const REFERENCE_TREE = TREES[REFERENCE_TREE_INDEX]
const DEFAULT_REFERENCE_PRICE = String(REFERENCE_TREE.baseCost)
const TREE_ICONS = [tree1Icon, tree2Icon, tree3Icon, tree4Icon]

function TreeIcon({ tier }: { tier: number }) {
  return <img className="tree-icon" src={TREE_ICONS[tier]} alt="" />
}

function discountLabel(ratio: number): string {
  if (ratio === 1) {
    return 'no global discount'
  }
  const percent = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(Math.abs(1 - ratio) * 100)
  return ratio < 1
    ? `${percent}% global discount`
    : `${percent}% above base price`
}

function TreeComparator() {
  const [referencePrice, setReferencePrice] = useState(() =>
    loadStored(TOOL, 'referencePrice', DEFAULT_REFERENCE_PRICE),
  )

  const price = parseNumber(referencePrice)
  const valid = price !== null && price > 0

  const rows = useMemo(() => (valid ? treeRows(price) : []), [valid, price])
  const upgradeRows = useMemo(() => upgrades(rows), [rows])

  useEffect(() => {
    saveStored(TOOL, 'referencePrice', referencePrice)
  }, [referencePrice])

  return (
    <main className="page tree-comparator">
      <section className="controls">
        <label>
          <span>
            <TreeIcon tier={REFERENCE_TREE_INDEX} /> {REFERENCE_TREE.label}{' '}
            price in your game
          </span>
          <input
            value={referencePrice}
            onChange={(event) => setReferencePrice(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <p className="constant">1 tick = {TICK_SECONDS}s</p>
      </section>

      {!valid ? (
        <p className="error">
          Enter a {REFERENCE_TREE.label} price above 0.
        </p>
      ) : (
        <>
          <p className="hint">
            Base {REFERENCE_TREE.label} price is{' '}
            {formatGold(REFERENCE_TREE.baseCost)} gold, so you have{' '}
            <strong>{discountLabel(priceRatio(price))}</strong>. Every other
            tier is scaled by the same factor.
          </p>

          <section className="table-wrap">
            <table className="tree-table">
              <thead>
                <tr>
                  <th>Tree</th>
                  <th>Price</th>
                  <th>Gold / tick</th>
                  <th>Pollution</th>
                  <th>Gold / pollution</th>
                  <th>Pays for itself in</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.label}>
                    <th scope="row">
                      <TreeIcon tier={index} />
                      {row.label}
                    </th>
                    <td>{formatGold(row.cost)}</td>
                    <td>{row.goldPerTick}</td>
                    <td>−{row.pollution}</td>
                    <td>{formatGold(row.goldPerPollution)}</td>
                    <td>
                      <strong>{formatTicks(row.breakEvenTicks)} ticks</strong>
                      <span className="duration">
                        {formatDuration(row.breakEvenTicks * TICK_SECONDS)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="upgrades">
            <h2>Upgrade payback</h2>
            <p className="hint">
              An upgrade costs the full price of the new tree, but only earns
              you the difference in gold per tick.
            </p>
            <div className="table-wrap">
              <table className="tree-table">
                <thead>
                  <tr>
                    <th>Upgrade</th>
                    <th>Cost</th>
                    <th>Extra gold / tick</th>
                    <th>Extra pollution</th>
                    <th>Breaks even in</th>
                  </tr>
                </thead>
                <tbody>
                  {upgradeRows.map((upgrade, index) => (
                    <tr key={upgrade.to.label}>
                      <th scope="row">
                        <TreeIcon tier={index} />
                        {upgrade.from.label}
                        <span className="arrow" aria-hidden="true">
                          →
                        </span>
                        <TreeIcon tier={index + 1} />
                        {upgrade.to.label}
                      </th>
                      <td>{formatGold(upgrade.cost)}</td>
                      <td>+{upgrade.extraGoldPerTick}</td>
                      <td>−{upgrade.extraPollution}</td>
                      <td>
                        <strong>{formatTicks(upgrade.ticks)} ticks</strong>
                        <span className="duration">
                          {formatDuration(upgrade.ticks * TICK_SECONDS)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default TreeComparator
