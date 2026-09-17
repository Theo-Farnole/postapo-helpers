import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import {
  formatGroupedInput,
  groupedInputCaret,
  idlePayout,
  optimumC,
  parseNumber,
  sampleCurve,
} from '../resourceExcess'
import chipsIcon from '../assets/resources/chips.webp'
import steelIcon from '../assets/resources/Steel.webp'
import uraniumIcon from '../assets/resources/Uranium_battery.webp'
import { loadStored, saveStored } from '../localStore'
import './ResourcesExcessCalculator.css'

ChartJS.register(LinearScale, LineController, PointElement, LineElement, Tooltip, Legend)

const TOOL = 'resourcesexcess'

type ResourceConfig = {
  id: string
  label: string
  icon: string
  revenueKey: string
  maximumKey: string
  defaults: { revenue: string; maximum: string }
}

const RESOURCES: ResourceConfig[] = [
  {
    id: 'chips',
    label: 'Chips',
    icon: chipsIcon,
    revenueKey: 'revenue',
    maximumKey: 'maximum',
    defaults: { revenue: '365000', maximum: '800000000' },
  },
  {
    id: 'steel',
    label: 'Steel batteries',
    icon: steelIcon,
    revenueKey: 'steelRevenue',
    maximumKey: 'steelMaximum',
    defaults: { revenue: '', maximum: '' },
  },
  {
    id: 'uranium',
    label: 'Uranium batteries',
    icon: uraniumIcon,
    revenueKey: 'uraniumRevenue',
    maximumKey: 'uraniumMaximum',
    defaults: { revenue: '', maximum: '' },
  },
]

function ResourceIcon({ src }: { src: string }) {
  return <img className="resource-icon" src={src} alt="" />
}

function GroupedNumberInput({
  value,
  onChange,
  ...props
}: {
  value: string
  onChange: (value: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    const caret = caretRef.current
    if (!input || caret === null) {
      return
    }
    input.setSelectionRange(caret, caret)
    caretRef.current = null
  }, [value])

  return (
    <input
      {...props}
      ref={inputRef}
      value={value}
      onChange={(event) => {
        const raw = event.target.value
        const caret = event.target.selectionStart ?? raw.length
        const significantBefore = raw
          .slice(0, caret)
          .replace(/[\s\u00A0\u202F\u2009]/g, '').length
        const formatted = formatGroupedInput(raw)
        caretRef.current = groupedInputCaret(formatted, significantBefore)
        onChange(formatted)
      }}
    />
  )
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(
    value,
  )
}

function ResourcesExcessCalculator() {
  return (
    <main className="page">
      <div className="rows">
        {RESOURCES.map((resource) => (
          <ResourceExcessRow key={resource.id} resource={resource} />
        ))}
      </div>
    </main>
  )
}

function ResourceExcessRow({ resource }: { resource: ResourceConfig }) {
  const titleId = useId()
  const [revenue, setRevenue] = useState(() =>
    formatGroupedInput(
      loadStored(TOOL, resource.revenueKey, resource.defaults.revenue),
    ),
  )
  const [maximum, setMaximum] = useState(() =>
    formatGroupedInput(
      loadStored(TOOL, resource.maximumKey, resource.defaults.maximum),
    ),
  )
  const [chartOpen, setChartOpen] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const r = parseNumber(revenue)
  const m = parseNumber(maximum)
  const empty = revenue.trim() === '' && maximum.trim() === ''
  const valid = r !== null && m !== null && r >= 0 && m >= 0

  const optimal = valid ? optimumC(r, m) : null
  const best =
    valid && optimal !== null ? idlePayout(optimal, r, m) : null
  const curve = useMemo(
    () => (valid ? sampleCurve(r, m) : []),
    [valid, r, m],
  )

  useEffect(() => {
    saveStored(TOOL, resource.revenueKey, revenue)
  }, [resource.revenueKey, revenue])

  useEffect(() => {
    saveStored(TOOL, resource.maximumKey, maximum)
  }, [maximum, resource.maximumKey])

  useEffect(() => {
    if (!valid && chartOpen) {
      setChartOpen(false)
    }
  }, [chartOpen, valid])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    if (chartOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
      setChartReady(true)
      return
    }
    if (dialog.open) {
      dialog.close()
    }
    setChartReady(false)
  }, [chartOpen])

  return (
    <section className="row">
      <div className="toolbar">
        <p className="row-name">
          <img className="row-icon" src={resource.icon} alt="" />
          {resource.label}
        </p>
        <label>
          <span>
            <ResourceIcon src={resource.icon} /> revenue per tick
          </span>
          <GroupedNumberInput
            value={revenue}
            onChange={setRevenue}
            inputMode="decimal"
            aria-label={`${resource.label} revenue per tick`}
          />
        </label>
        <label>
          <span>
            <ResourceIcon src={resource.icon} /> maximum resource
          </span>
          <GroupedNumberInput
            value={maximum}
            onChange={setMaximum}
            inputMode="decimal"
            aria-label={`${resource.label} maximum resource`}
          />
        </label>
        {valid ? (
        <p className="result">
          Idle at {formatValue(optimal ?? 0)}
          <ResourceIcon src={resource.icon} /> to get{' '}
          {formatValue(best?.total ?? 0)}
          <ResourceIcon src={resource.icon} />
        </p>
        ) : empty ? null : (
          <p className="error">Enter non-negative numbers for R and M.</p>
        )}
        <button
          type="button"
          className="chart-button"
          disabled={!valid}
          aria-expanded={chartOpen}
          aria-haspopup="dialog"
          onClick={() => setChartOpen((open) => !open)}
        >
          Chart
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="chart-dialog"
        aria-labelledby={titleId}
        onClose={() => setChartOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setChartOpen(false)
          }
        }}
      >
        <div className="chart-dialog-header">
          <h2 id={titleId}>{resource.label} idle + ad chart</h2>
          <button
            type="button"
            className="chart-dialog-close"
            onClick={() => setChartOpen(false)}
            aria-label={`Close ${resource.label} chart`}
          >
            ×
          </button>
        </div>
        {chartReady && valid ? (
          <CurveChart
            points={curve}
            optimum={optimal ?? 0}
            maxC={m}
          />
        ) : null}
      </dialog>
    </section>
  )
}

type CurveChartProps = {
  points: { c: number; total: number; earned: number }[]
  optimum: number
  maxC: number
}

function CurveChart({
  points,
  optimum,
  maxC,
}: CurveChartProps) {
  const yMin = Math.min(
    0,
    maxC,
    ...points.map((point) => point.total),
    ...points.map((point) => point.earned),
  )
  const yMax = Math.max(
    maxC,
    ...points.map((point) => point.total),
    ...points.map((point) => point.earned),
  )

  const data = useMemo<ChartData<'line'>>(
    () => ({
      datasets: [
        {
          type: 'line',
          label: 'After idle + ad',
          data: points.map((point) => ({ x: point.c, y: point.total })),
          borderColor: '#aa3bff',
          backgroundColor: '#aa3bff',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0,
        },
        {
          type: 'line',
          label: 'Earned from idle + ad',
          data: points.map((point) => ({ x: point.c, y: point.earned })),
          borderColor: '#22c55e',
          backgroundColor: '#22c55e',
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
          title: { display: true, text: 'Resources' },
          min: yMin,
        },
      },
      plugins: {
        legend: { position: 'bottom' },
      },
    }),
    [maxC, yMin],
  )

  return (
    <section className="chart">
      <Chart type="line" data={data} options={options} />
    </section>
  )
}

export default ResourcesExcessCalculator
