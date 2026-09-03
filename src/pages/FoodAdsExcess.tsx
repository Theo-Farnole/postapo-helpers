import { useEffect, useState } from 'react'
import foodIcon from '../assets/resources/food.webp'
import { loadStored, saveStored } from '../localStore'
import './FoodAdsExcess.css'

const TOOL = 'foodads'
const TICK_SECONDS = 9
const DURATION_SECONDS = 300
const TICKS = Math.floor(DURATION_SECONDS / TICK_SECONDS)
const LOSS_PER_TICK = 0.99
const BONUS_MULTIPLIER = 3

function loadCap(): string {
  return loadStored(TOOL, 'cap', '18')
}

function formatFood(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
}

function estimatedStock(cap: number): number {
  const newEquilibrium = cap * BONUS_MULTIPLIER
  return newEquilibrium + (cap - newEquilibrium) * Math.pow(LOSS_PER_TICK, TICKS)
}

function FoodAdsExcess() {
  const [millions, setMillions] = useState(loadCap)

  const cap = Number.parseFloat(millions)
  const valid = Number.isFinite(cap)
  const foodCap = valid ? cap * 1_000_000 : null
  const stock =
    foodCap !== null && foodCap > 0 ? estimatedStock(foodCap) : null

  useEffect(() => {
    saveStored(TOOL, 'cap', millions)
  }, [millions])

  return (
    <main className="page tycoon-bonus">
      <section className="controls">
        <label>
          <span>Current food cap</span>
          <span className="input-wrap">
            <input
              value={millions}
              onChange={(event) => setMillions(event.target.value)}
              inputMode="decimal"
              step="0.1"
              type="number"
            />
            <span className="suffix">M</span>
          </span>
        </label>
      </section>

      <section className="result">
        <p>Estimated stock after 5 min:</p>
        <p className="value">
          {stock !== null ? formatFood(stock) : '—'}
          <img className="food-icon food-icon-value" src={foodIcon} alt="" />
        </p>
      </section>
    </main>
  )
}

export default FoodAdsExcess
