import React, { useMemo } from 'react'
import { Plus, Trash2, Divide, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatARS, toNumber } from '../../utils/formatters'
import {
  createDefaultSplitTramos,
  createNextTramo,
  distributeTotalAcrossTramos,
} from '../../utils/ingresoSplit'

const MAX_TRAMOS = 6

const IngresoSplitFields = ({
  mode = 'plantilla',
  totalMonto,
  tramos,
  onChangeTramos,
  onSyncTotalFromTramos,
  periodoYm,
  idPrefix = 'split',
}) => {
  const totalNum = Math.max(0, toNumber(totalMonto, 0))

  const sumTramos = useMemo(() => {
    const raw = (tramos || []).reduce((acc, t) => acc + Math.max(0, toNumber(t.monto, 0)), 0)
    return Math.round(raw * 100) / 100
  }, [tramos])

  const diff = Math.round((sumTramos - totalNum) * 100) / 100
  const matchesTotal = totalNum > 0 && Math.abs(diff) <= 0.01

  const applyPreset = (config) => {
    const next = createDefaultSplitTramos({
      total: totalNum,
      count: config.count,
      mode,
      periodoYm,
      baseDays: config.days,
      labels: config.labels,
    })
    onChangeTramos(next, true)
  }

  const handleRedistributeEqual = () => {
    if (!tramos || tramos.length < 2) return
    const amounts = distributeTotalAcrossTramos(totalNum, tramos.length)
    const next = tramos.map((t, idx) => ({
      ...t,
      monto: totalNum > 0 ? String(amounts[idx]) : '',
    }))
    onChangeTramos(next, true)
  }

  const updateField = (key, field, value) => {
    const next = tramos.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    const keepAuto = field !== 'monto'
    onChangeTramos(next, keepAuto ? undefined : false)
  }

  const handleAddTramo = () => {
    if (tramos.length >= MAX_TRAMOS) return
    const nextTramo = createNextTramo({ existingTramos: tramos, mode, periodoYm })
    onChangeTramos([...tramos, nextTramo], false)
  }

  const handleRemoveTramo = (key) => {
    if (tramos.length <= 2) return
    onChangeTramos(
      tramos.filter((t) => t.key !== key),
      false
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900/75 border border-blue-500/25 p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Divide className="h-3.5 w-3.5" />
            <span>Tramos y días de cobro</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cada tramo se registra con su propio día/fecha y estado de cobro independiente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRedistributeEqual}
          disabled={totalNum <= 0}
          className="btn-secondary min-h-[36px] px-3 py-1.5 text-xs"
        >
          <Divide className="h-3.5 w-3.5 text-blue-400" />
          <span>Repartir igual</span>
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() =>
            applyPreset({ count: 2, days: [5, 20], labels: ['1ra mitad', '2da mitad'] })
          }
          className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/25 text-blue-200 border border-blue-500/30 transition-colors cursor-pointer"
        >
          Al medio (50/50 · días 5 y 20)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({ count: 2, days: [1, 15], labels: ['1ra quincena', '2da quincena'] })
          }
          className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          Quincenas (50/50 · días 1 y 15)
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ count: 3 })}
          className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          3 pagos
        </button>
        <button
          type="button"
          onClick={() => applyPreset({ count: 4 })}
          className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          4 pagos
        </button>
      </div>

      {/* Editable tramos list */}
      <div className="space-y-2.5">
        {tramos.map((tramo, idx) => {
          const etiqId = `${idPrefix}-etiqueta-${tramo.key}`
          const montoId = `${idPrefix}-monto-${tramo.key}`
          const dateId = `${idPrefix}-fecha-${tramo.key}`
          const cobradoId = `${idPrefix}-cobrado-${tramo.key}`

          return (
            <div
              key={tramo.key}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-3 rounded-xl bg-slate-950/60 border border-slate-800/90"
            >
              <div className="sm:col-span-4">
                <label htmlFor={etiqId} className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Etiqueta tramo #{idx + 1}
                </label>
                <input
                  id={etiqId}
                  type="text"
                  value={tramo.etiqueta}
                  onChange={(e) => updateField(tramo.key, 'etiqueta', e.target.value)}
                  placeholder={`Tramo ${idx + 1}`}
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor={montoId} className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Monto (ARS)
                </label>
                <input
                  id={montoId}
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={tramo.monto}
                  onChange={(e) => updateField(tramo.key, 'monto', e.target.value)}
                  placeholder="250000"
                  className="input-field tabular-nums"
                />
              </div>

              {mode === 'plantilla' ? (
                <div className="sm:col-span-4">
                  <label htmlFor={dateId} className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Día de cobro (1–31)
                  </label>
                  <input
                    id={dateId}
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={tramo.dia_cobro}
                    onChange={(e) => updateField(tramo.key, 'dia_cobro', e.target.value)}
                    className="input-field tabular-nums"
                  />
                </div>
              ) : (
                <>
                  <div className="sm:col-span-3">
                    <label htmlFor={dateId} className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Fecha cobro
                    </label>
                    <input
                      id={dateId}
                      type="date"
                      required
                      value={tramo.fecha_cobro || ''}
                      onChange={(e) => updateField(tramo.key, 'fecha_cobro', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center">
                    <label
                      htmlFor={cobradoId}
                      className="inline-flex items-center gap-1.5 min-h-[44px] text-xs text-slate-200 cursor-pointer"
                    >
                      <input
                        id={cobradoId}
                        type="checkbox"
                        checked={Boolean(tramo.cobrado)}
                        onChange={(e) => updateField(tramo.key, 'cobrado', e.target.checked)}
                        className="h-4 w-4 accent-emerald-500 rounded"
                      />
                      <span className="sm:sr-only">Ya cobrado</span>
                      <span className="hidden sm:inline text-[11px] text-slate-300">OK</span>
                    </label>
                  </div>
                </>
              )}

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveTramo(tramo.key)}
                  disabled={tramos.length <= 2}
                  aria-label={`Quitar tramo ${tramo.etiqueta || idx + 1}`}
                  className="btn-ghost border border-slate-800 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add tramo + Totals footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleAddTramo}
          disabled={tramos.length >= MAX_TRAMOS}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Agregar otro día de cobro</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">
            Suma tramos:{' '}
            <strong className="text-slate-100 tabular-nums">{formatARS(sumTramos)}</strong>
          </span>

          {matchesTotal && (
            <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Coincide con total</span>
            </span>
          )}

          {totalNum > 0 && !matchesTotal && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {diff > 0 ? `+${formatARS(diff)}` : formatARS(diff)} vs total ({formatARS(totalNum)})
                </span>
              </span>
              {typeof onSyncTotalFromTramos === 'function' && sumTramos > 0 && (
                <button
                  type="button"
                  onClick={() => onSyncTotalFromTramos(sumTramos)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[11px] font-semibold cursor-pointer"
                >
                  Usar suma de tramos como total
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IngresoSplitFields
