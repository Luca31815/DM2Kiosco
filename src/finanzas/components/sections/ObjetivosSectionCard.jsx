import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Target, Plus, Pencil, Check, X, Loader2, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatCompactARS, formatPercent, toNumber } from '../../utils/formatters'
import {
  OBJETIVO_TIPOS,
  createObjetivoId,
  getTipoObjetivoMeta,
  resolveObjetivosList,
  evaluateObjetivoProgress,
} from '../../utils/objetivosMeta'
import { StatusBadge, ProgressBar, EmptyState, ConfirmDeleteButton } from '../ui/Primitives'

const createEmptyForm = () => ({
  id: null,
  nombre: '',
  tipo: 'sueldo_kiosco',
  monto_objetivo: '',
  monto_actual_manual: '0',
  notas: '',
})

const ObjetivosSectionCard = ({ resumen, periodoYm, onSaveObjetivos }) => {
  const { config, kiosco_mes } = resumen

  const objetivos = useMemo(() => resolveObjetivosList(config), [config])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [saving, setSaving] = useState(false)

  // Quick "+ Aporte" inline state for manual savings goals
  const [aporteId, setAporteId] = useState(null)
  const [aporteMonto, setAporteMonto] = useState('')

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const gananciaMes = toNumber(kiosco_mes.ganancia_estimada_mes, 0)
  const ventasMes = toNumber(kiosco_mes.ventas_mes, 0)
  const comprasMes = toNumber(kiosco_mes.compras_mes, 0)
  const netoCajaMes = toNumber(kiosco_mes.neto_caja_mes, ventasMes - comprasMes)
  const proyCierre = toNumber(kiosco_mes.proyeccion_cierre, 0)
  const retirosMes = toNumber(kiosco_mes.retiros_mes, 0)

  const selectedTipoMeta = getTipoObjetivoMeta(form.tipo)

  const openNewForm = () => {
    setForm(createEmptyForm())
    setShowForm(true)
  }

  const openEditForm = (obj) => {
    setForm({
      id: obj.id,
      nombre: obj.nombre || '',
      tipo: obj.tipo || 'sueldo_kiosco',
      monto_objetivo: String(toNumber(obj.monto_objetivo, 0)),
      monto_actual_manual: String(toNumber(obj.monto_actual_manual, 0)),
      notas: obj.notas || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('Escribí un nombre para el objetivo.')
      return
    }
    const montoObj = toNumber(form.monto_objetivo, -1)
    if (montoObj <= 0) {
      toast.error('Ingresá un monto objetivo mayor a 0.')
      return
    }
    const actualManual = selectedTipoMeta.isManual
      ? Math.max(0, toNumber(form.monto_actual_manual, 0))
      : 0

    const payloadItem = {
      id: form.id || createObjetivoId(),
      nombre: form.nombre.trim(),
      tipo: selectedTipoMeta.value,
      monto_objetivo: montoObj,
      monto_actual_manual: actualManual,
      notas: form.notas.trim(),
    }

    const nextList = form.id
      ? objetivos.map((item) => (item.id === form.id ? payloadItem : item))
      : [...objetivos, payloadItem]

    setSaving(true)
    try {
      await onSaveObjetivos(nextList)
      if (mountedRef.current) {
        setShowForm(false)
        setForm(createEmptyForm())
      }
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }

  const handleDeleteObjetivo = async (targetId) => {
    const nextList = objetivos.filter((item) => item.id !== targetId)
    await onSaveObjetivos(nextList)
  }

  const handleAddAporte = async (e, obj) => {
    e.preventDefault()
    const suma = toNumber(aporteMonto, -1)
    if (suma <= 0) {
      toast.error('Ingresá un aporte mayor a 0.')
      return
    }
    const nextList = objetivos.map((item) =>
      item.id === obj.id
        ? {
            ...item,
            monto_actual_manual:
              Math.round((Math.max(0, toNumber(item.monto_actual_manual, 0)) + suma) * 100) / 100,
          }
        : item
    )
    setSaving(true)
    try {
      await onSaveObjetivos(nextList)
      if (mountedRef.current) {
        setAporteId(null)
        setAporteMonto('')
      }
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-50">
              Objetivos y Metas del Mes ({objetivos.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Creá metas independientes por tipo (sueldo kiosco, ventas, margen, ahorro del mes, tope de gastos o fondo propio). No alteran el Balance Proyectado.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openNewForm())}
          className="btn-primary shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{showForm ? 'Cerrar' : 'Nuevo objetivo'}</span>
        </button>
      </div>

      {/* Kiosco Real Cashflow Strip (3 compact cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Neto real del mes (Ventas − Compras)</span>
          <p
            className={`font-display text-xl font-bold mt-1 tabular-nums ${
              netoCajaMes >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {formatARS(netoCajaMes)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1 tabular-nums">
            Ventas {formatCompactARS(ventasMes)} − Compras {formatCompactARS(comprasMes)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Margen productos vendidos (ref.)</span>
          <p className="font-display text-xl font-bold text-blue-300 mt-1 tabular-nums">
            {formatARS(gananciaMes)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1 tabular-nums">
            Solo lo vendido (sin stock comprado) · Proy. {formatCompactARS(proyCierre)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Retiros registrados (info)</span>
          <p className="font-display text-xl font-bold text-slate-200 mt-1 tabular-nums">
            {formatARS(retirosMes)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">
            Informativo · No duplica gastos
          </span>
        </div>
      </div>

      {/* Create / Edit Objective Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-blue-500/35 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display text-base font-bold text-slate-100">
              {form.id ? 'Editar objetivo' : `Nuevo objetivo para ${periodoYm}`}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Cerrar formulario de objetivo"
              className="btn-ghost"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            <div className="lg:col-span-4">
              <label htmlFor="obj-tipo" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de objetivo
              </label>
              <select
                id="obj-tipo"
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                className="input-field"
              >
                {OBJETIVO_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label htmlFor="obj-nombre" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del objetivo
              </label>
              <input
                id="obj-nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder={selectedTipoMeta.placeholder}
                className="input-field"
              />
            </div>

            <div className={selectedTipoMeta.isManual ? 'lg:col-span-2' : 'lg:col-span-4'}>
              <label htmlFor="obj-monto" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto objetivo (ARS)
              </label>
              <input
                id="obj-monto"
                type="number"
                min="1"
                step="any"
                required
                value={form.monto_objetivo}
                onChange={(e) => setForm((p) => ({ ...p, monto_objetivo: e.target.value }))}
                placeholder="250000"
                className="input-field tabular-nums"
              />
            </div>

            {selectedTipoMeta.isManual && (
              <div className="lg:col-span-2">
                <label htmlFor="obj-actual" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Acumulado actual (ARS)
                </label>
                <input
                  id="obj-actual"
                  type="number"
                  min="0"
                  step="any"
                  value={form.monto_actual_manual}
                  onChange={(e) => setForm((p) => ({ ...p, monto_actual_manual: e.target.value }))}
                  placeholder="0"
                  className="input-field tabular-nums"
                />
              </div>
            )}
          </div>

          <p className="text-xs text-blue-200/80 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
            {selectedTipoMeta.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label htmlFor="obj-notas" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nota breve (opcional)
              </label>
              <input
                id="obj-notas"
                type="text"
                value={form.notas}
                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                placeholder="Ej: Prioridad alta este mes"
                className="input-field"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Guardar objetivo</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Objectives List */}
      {objetivos.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin objetivos cargados este mes"
          description="Creá tus metas de sueldo del kiosco, ventas, ahorro o tope máximo de gastos para seguirlas en tiempo real."
          action={
            <button type="button" onClick={openNewForm} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Crear primer objetivo</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objetivos.map((obj) => {
            const typeMeta = getTipoObjetivoMeta(obj.tipo)
            const evalRes = evaluateObjetivoProgress(obj, resumen)
            const isAporteOpen = aporteId === obj.id

            return (
              <div
                key={obj.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm sm:text-base font-bold text-slate-50 truncate">
                        {obj.nombre}
                      </p>
                      <StatusBadge variant="info">{typeMeta.shortLabel}</StatusBadge>
                      <StatusBadge variant={evalRes.tone}>{evalRes.statusLabel}</StatusBadge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {evalRes.metricHint}
                      {obj.notas ? ` · ${obj.notas}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {typeMeta.isManual && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isAporteOpen) {
                            setAporteId(null)
                          } else {
                            setAporteId(obj.id)
                            setAporteMonto('')
                          }
                        }}
                        className="inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 transition-colors cursor-pointer"
                      >
                        <Coins className="h-3.5 w-3.5" />
                        <span>+ Aporte</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(obj)}
                      aria-label={`Editar objetivo ${obj.nombre}`}
                      className="btn-ghost border border-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <ConfirmDeleteButton
                      onConfirm={() => handleDeleteObjetivo(obj.id)}
                      ariaLabel={`Eliminar objetivo ${obj.nombre}`}
                      confirmLabel="Borrar"
                    />
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <div className="tabular-nums">
                    <strong className="font-display text-base sm:text-lg font-bold text-slate-50">
                      {formatARS(evalRes.actual)}
                    </strong>
                    <span className="text-slate-400 ml-1.5">
                      / {formatARS(evalRes.objetivoMonto)}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-200 tabular-nums">
                    {formatPercent(evalRes.pct)}
                  </span>
                </div>

                <ProgressBar value={evalRes.pct} tone={evalRes.tone} heightClass="h-2.5" />

                <p className="text-[11px] text-slate-400 tabular-nums">
                  {typeMeta.inverse ? (
                    evalRes.excedido ? (
                      <span className="text-rose-300 font-medium">
                        Excedido por {formatARS(evalRes.faltante)} sobre el tope
                      </span>
                    ) : (
                      <span>Margen disponible dentro del tope: {formatARS(evalRes.faltante)}</span>
                    )
                  ) : evalRes.cumplido ? (
                    <span className="text-emerald-300 font-medium">
                      Objetivo alcanzado
                      {evalRes.actual > evalRes.objetivoMonto
                        ? ` (+${formatARS(evalRes.actual - evalRes.objetivoMonto)})`
                        : ''}
                    </span>
                  ) : (
                    <span>Faltan {formatARS(evalRes.faltante)} para completar la meta</span>
                  )}
                </p>

                {typeMeta.isManual && isAporteOpen && (
                  <form
                    onSubmit={(e) => handleAddAporte(e, obj)}
                    className="pt-3 border-t border-slate-800/80 flex flex-wrap items-end gap-2"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <label
                        htmlFor={`aporte-input-${obj.id}`}
                        className="block text-[11px] font-semibold text-emerald-300 mb-1"
                      >
                        Sumar aporte (ARS)
                      </label>
                      <input
                        id={`aporte-input-${obj.id}`}
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={aporteMonto}
                        onChange={(e) => setAporteMonto(e.target.value)}
                        placeholder="50000"
                        className="input-field tabular-nums"
                      />
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary px-3">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Sumar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAporteId(null)}
                      aria-label="Cancelar aporte"
                      className="btn-ghost border border-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default React.memo(ObjetivosSectionCard)
