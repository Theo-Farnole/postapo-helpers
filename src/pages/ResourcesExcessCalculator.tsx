import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import {
  TICK,
  idlePayout,
  optimumC,
  parseNumber,
  sampleCurve,
} from '../resourceExcess'
import chipsIcon from '../assets/resources/chips.webp'
import { loadStored, saveStored } from '../localStore'
import './ResourcesExcessCalculator.css'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

const TOOL = 'resourcesexcess'
const DEFAULTS = { revenue: '365000', maximum: '800000000' }

function ChipsIcon() {
  return <img className="chips-icon" src={chipsIcon} alt="" />
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(
    value,
  )
}

function ResourcesExcessCalculator() {
  const [revenue, setRevenue] = useState(() =>
    loadStored(TOOL, 'revenue', DEFAULTS.revenue),
  )
  const [maximum, setMaximum] = useState(() =>
    loadStored(TOOL, 'maximum', DEFAULTS.maximum),
  )

  const r = parseNumber(revenue)
  const m = parseNumber(maximum)
  const valid = r !== null && m !== null && r >= 0 && m >= 0

  const optimal = valid ? optimumC(r, m) : null
  const best =
    valid && optimal !== null ? idlePayout(optimal, r, m) : null
  const curve = useMemo(
    () => (valid ? sampleCurve(r, m) : []),
    [valid, r, m],
  )

  useEffect(() => {
    saveStored(TOOL, 'revenue', revenue)
  }, [revenue])

  useEffect(() => {
    saveStored(TOOL, 'maximum', maximum)
  }, [maximum])

  return (
    <main className="page">
      <section className="controls">
        <label>
          <span>
            <ChipsIcon /> revenue per tick
          </span>
          <input
            value={revenue}
            onChange={(event) => setRevenue(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          <span>
            <ChipsIcon /> maximum resource
          </span>
          <input
            value={maximum}
            onChange={(event) => setMaximum(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <p className="constant">T = {TICK}</p>
      </section>

      {!valid ? (
        <p className="error">Enter non-negative numbers for R and M.</p>
      ) : (
        <>
          <section className="result">
            <p>
              Then after idle + ad you have{' '}
              <strong>
                {formatValue(best?.total ?? 0)}
                <ChipsIcon />
              </strong>, which is{' '}
              <strong>
                {formatValue(best?.overflow ?? 0)}
                <ChipsIcon />
              </strong>{' '}
              over the cap.
            </p>
          </section>

          <CurveChart
            points={curve}
            optimum={optimal ?? 0}
            maxC={m}
          />
        </>
      )}
    </main>
  )
}

type CurveChartProps = {
  points: { c: number; y: number }[]
  optimum: number
  maxC: number
}

function CurveChart({
  points,
  optimum,
  maxC,
}: CurveChartProps) {
  const ys = points.map((point) => point.y)
  const yMin = Math.min(maxC, ...ys)
  const yMax = Math.max(maxC, ...ys)

  const data = useMemo<ChartData<'line'>>(
    () => ({
      datasets: [
        {
          type: 'line',
          label: 'After idle + ad',
          data: points.map((point) => ({ x: point.c, y: point.y })),
          borderColor: '#aa3bff',
          backgroundColor: '#aa3bff',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0,
        },
        {
          type: 'line',
          label: 'Maximum',
          data: [
            { x: 0, y: maxC },
            { x: maxC, y: maxC },
          ],
          borderColor: '#6b7280',
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          type: 'line',
          label: 'Idle at this C',
          data: [
            { x: optimum, y: yMin },
            { x: optimum, y: yMax },
          ],
          borderColor: '#aa3bff',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    }),
    [maxC, optimum, points, yMax, yMin],
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Current resource C' },
          min: 0,
          max: maxC || undefined,
        },
        y: {
          title: { display: true, text: 'Resources after idle + ad' },
        },
      },
      plugins: {
        legend: { position: 'bottom' },
      },
    }),
    [maxC],
  )

  return (
    <section className="chart">
      <Chart type="line" data={data} options={options} />
    </section>
  )
}

export default ResourcesExcessCalculator
