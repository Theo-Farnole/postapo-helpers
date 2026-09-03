import { useMemo, useState } from 'react'
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
  exceedCapC,
  idlePayout,
  optimumC,
  parseNumber,
  sampleCurve,
} from '../resourceExcess'
import chipsIcon from '../assets/resources/chips.webp'
import './ResourcesExcessCalculator.css'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

function ChipsIcon() {
  return <img className="chips-icon" src={chipsIcon} alt="" />
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(
    value,
  )
}

function ResourcesExcessCalculator() {
  const [revenue, setRevenue] = useState('1')
  const [maximum, setMaximum] = useState('2000')
  const [current, setCurrent] = useState('0')

  const r = parseNumber(revenue)
  const m = parseNumber(maximum)
  const c = parseNumber(current)
  const valid = r !== null && m !== null && r >= 0 && m >= 0

  const optimal = valid ? optimumC(r, m) : null
  const exceedAt = valid ? exceedCapC(r, m) : null
  const best =
    valid && optimal !== null ? idlePayout(optimal, r, m) : null
  const now = valid && c !== null && c >= 0 ? idlePayout(c, r, m) : null
  const curve = useMemo(
    () => (valid ? sampleCurve(r, m) : []),
    [valid, r, m],
  )

  return (
    <main className="page">
      <header>
        <h1>Resources excess calculator</h1>
        <p>after 50% ads bonus</p>
      </header>

      <section className="controls">
        <label>
          <span>
            R
            <ChipsIcon /> · revenue per tick
          </span>
          <input
            value={revenue}
            onChange={(event) => setRevenue(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          <span>
            M
            <ChipsIcon /> · maximum resource
          </span>
          <input
            value={maximum}
            onChange={(event) => setMaximum(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label>
          <span>
            C
            <ChipsIcon /> · current resource
          </span>
          <input
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
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
              Idle at C = <strong>{formatValue(optimal ?? 0)}</strong>
            </p>
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
            currentC={c}
            currentY={now?.total ?? null}
            optimum={optimal ?? 0}
            optimumY={best?.total ?? 0}
            maxC={m}
          />
        </>
      )}
    </main>
  )
}

type CurveChartProps = {
  points: { c: number; y: number }[]
  currentC: number | null
  currentY: number | null
  optimum: number
  optimumY: number
  maxC: number
}

function CurveChart({
  points,
  currentC,
  currentY,
  optimum,
  optimumY,
  maxC,
}: CurveChartProps) {
  const ys = points.map((point) => point.y)
  const yMin = Math.min(maxC, ...ys)
  const yMax = Math.max(maxC, ...ys)
  const entered =
    currentC !== null && currentC >= 0 && currentC <= maxC && currentY !== null
      ? { x: currentC, y: currentY }
      : null

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
        {
          type: 'line',
          label: 'Optimum',
          data: [{ x: optimum, y: optimumY }],
          borderColor: '#aa3bff',
          backgroundColor: '#aa3bff',
          pointRadius: 6,
          showLine: false,
        },
        {
          type: 'line',
          label: 'Your C',
          data: entered ? [entered] : [],
          borderColor: '#16a34a',
          backgroundColor: '#16a34a',
          pointRadius: entered ? 6 : 0,
          showLine: false,
        },
      ],
    }),
    [entered, maxC, optimum, optimumY, points, yMax, yMin],
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
