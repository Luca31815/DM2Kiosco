import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  RotateCcw,
  Wallet,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatDateAR, getTodayISOAR, toNumber } from '../../utils/formatters'
import { filterDeudas } from '../../utils/finanzasFilters'
import {
  SectionHeader,
  StatusBadge,
  AmbitoBadge,
  PrioridadBadge,
  ProgressBar,
  EmptyState,
} from '../ui/Primitives'

const EMPTY_DEUDA = {
  id: null,
  acreedor: '',
  concepto: '',
  ambito: 'personal',
  monto_total: '',
  cuotas_totales: '12',
  cuotas_pagadas: '0',
  monto_cuota: '',
  dia_vencimiento: '10',
  fecha_inicio: getTodayISOAR(),
  saldo_pendiente: '',
  prioridad: 'alta',
  estado: 'activa',
  notas: '',
}

const DeudasSection = ({ resumen, periodoYm, onCrudDeuda }) => {
  const [filterEstado, setFilterEstado] = useState('activa')
  const [filterAmbito, setFilterAmbito] = useState('todos')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_DEUDA)
  const [saving, setSaving] = useState(false)

  // Inline payment registration drawer inside a debt card
  const [payingDeudaId, setPayingDeudaId] = useState(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoCuotaNum, setPagoCuotaNum] = useState('')
  const [pagoFecha, setPagoFecha] = useState(getTodayISOAR())
  const [pagoNotas, setPagoNotas] = useState('')

  // Expanded payment history per debt
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)

  const deudas = useMemo(() => resumen.deudas.items || [], [resumen.deudas.items])
  const pagosMes = useMemo(() => resumen.deudas.pagos_mes || [], [resumen.deudas.pagos_mes])

  const filteredDeudas = useMemo(
    () => filterDeudas(deudas, { estado: filterEstado, ambito: filterAmbito }),
    [deudas, filterEstado, filterAmbito]
  )

  const pagosPorDeuda = useMemo(() => {
    const map = new Map()
    pagosMes.forEach((p) => {
      const list = map.get(p.deuda_id) || []
      list.push(p)
      map.set(p.deuda_id, list)
    })
    return map
  }, [pagosMes])

  const totalPagadoMes = useMemo(() => {
    if (resumen.deudas.total_pagado_mes !== undefined && resumen.deudas.total_pagado_mes !== null) {
      return toNumber(resumen.deudas.total_pagado_mes, 0)
    }
    return pagosMes.reduce((acc, p) => acc + toNumber(p.monto_pagado, 0), 0)
  }, [resumen.deudas.total_pagado_mes, pagosMes])

  const openNewDeuda = () => {
    setForm(EMPTY_DEUDA)
    setShowForm(true)
  }

  const openEditDeuda = (d) => {
    setForm({
      id: d.id,
      acreedor: d.acreedor || '',
      concepto: d.concepto || '',
      ambito: d.ambito || 'personal',
      monto_total: String(toNumber(d.monto_total, 0)),
      cuotas_totales: String(d.cuotas_totales ?? 1),
      cuotas_pagadas: String(d.cuotas_pagadas ?? 0),
      monto_cuota: String(toNumber(d.monto_cuota, 0)),
      dia_vencimiento: String(d.dia_vencimiento ?? 10),
      fecha_inicio: d.fecha_inicio ? String(d.fecha_inicio).slice(0, 10) : getTodayISOAR(),
      saldo_pendiente: String(toNumber(d.saldo_pendiente, 0)),
      prioridad: d.prioridad || 'alta',
      estado: d.estado || 'activa',
      notas: d.notas || '',
    })
    setShowForm(true)
  }

  const handleMontoOrCuotasChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      const total = toNumber(next.monto_total, 0)
      const cuotas = Math.max(1, parseInt(next.cuotas_totales, 10) || 1)
      const pagadas = Math.max(0, parseInt(next.cuotas_pagadas, 10) || 0)
      if (!prev.id && total > 0) {
        if (field === 'monto_total' || field === 'cuotas_totales') {
          next.monto_cuota = String(Math.round(total / cuotas))
        }
        if (field === 'monto_total' || field === 'cuotas_totales' || field === 'cuotas_pagadas') {
          const cuotaEst = toNumber(next.monto_cuota, total / cuotas)
          next.saldo_pendiente = String(Math.max(0, Math.round(total - pagadas * cuotaEst)))
        }
      }
      return next
    })
  }

  const handleSaveDeuda = async (e) => {
    e.preventDefault()
    if (!form.acreedor.trim() || !form.concepto.trim()) {
      toast.error('Completá acreedor y concepto.')
      return
    }
    const montoTotal = toNumber(form.monto_total, -1)
    const montoCuota = toNumber(form.monto_cuota, -1)
    const cuotasTotales = Math.max(1, parseInt(form.cuotas_totales, 10) || 1)
    const cuotasPagadas = Math.max(0, parseInt(form.cuotas_pagadas, 10) || 0)
    const saldo =
      form.saldo_pendiente !== ''
        ? toNumber(form.saldo_pendiente, 0)
        : Math.max(0, montoTotal - cuotasPagadas * Math.max(0, montoCuota))

    if (montoTotal <= 0 || montoCuota < 0) {
      toast.error('Verificá los montos de la deuda.')
      return
    }

    setSaving(true)
    try {
      await onCrudDeuda('upsert', {
        ...(form.id ? { id: form.id } : {}),
        acreedor: form.acreedor.trim(),
        concepto: form.concepto.trim(),
        ambito: form.ambito,
        monto_total: montoTotal,
        cuotas_totales: cuotasTotales,
        cuotas_pagadas: cuotasPagadas,
        monto_cuota: montoCuota,
        dia_vencimiento: Math.min(31, Math.max(1, parseInt(form.dia_vencimiento, 10) || 10)),
        fecha_inicio: form.fecha_inicio || null,
        saldo_pendiente: saldo,
        prioridad: form.prioridad,
        estado: form.estado,
        notas: form.notas.trim() || null,
      })
      setShowForm(false)
      setForm(EMPTY_DEUDA)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDeuda = async (d) => {
    if (!window.confirm(`¿Eliminar la deuda "${d.acreedor} — ${d.concepto}" y su historial de pagos?`)) {
      return
    }
    await onCrudDeuda('delete', { id: d.id })
  }

  const openPaymentDrawer = (d) => {
    setPayingDeudaId(d.id)
    setPagoMonto(String(toNumber(d.monto_cuota, d.saldo_pendiente)))
    setPagoCuotaNum(String(toNumber(d.cuotas_pagadas, 0) + 1))
    setPagoFecha(getTodayISOAR())
    setPagoNotas('')
  }

  const handleRegistrarPago = async (e, deuda) => {
    e.preventDefault()
    const montoNum = toNumber(pagoMonto, -1)
    if (montoNum <= 0) {
      toast.error('El monto del pago debe ser mayor a 0.')
      return
    }
    setSaving(true)
    try {
      await onCrudDeuda('registrar_pago', {
        deuda_id: deuda.id,
        periodo_ym: periodoYm,
        numero_cuota: parseInt(pagoCuotaNum, 10) || toNumber(deuda.cuotas_pagadas, 0) + 1,
        monto_pagado: montoNum,
        fecha_pago: pagoFecha || getTodayISOAR(),
        notas: pagoNotas.trim() || null,
      })
      setPayingDeudaId(null)
      setExpandedHistoryId(deuda.id)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarPago = async (pago) => {
    if (
      !window.confirm(
        `¿Deshacer este pago de ${formatARS(pago.monto_pagado)}? El saldo pendiente y el contador de cuotas volverán atrás automáticamente.`
      )
    ) {
      return
    }
    await onCrudDeuda('eliminar_pago', {
      pago_id: pago.id,
      id: pago.id,
    })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Deudas (Pasivos y Cuotas)"
        subtitle="Seguí cuotas pagadas vs totales, saldo pendiente y registrá pagos que descuentan automáticamente del pasivo."
        actions={
          <button type="button" onClick={openNewDeuda} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>Nueva deuda</span>
          </button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs text-slate-400">Saldo total pendiente</span>
          <p className="font-display text-2xl font-bold text-rose-300 tabular-nums mt-1">
            {formatARS(resumen.deudas.saldo_total_pendiente)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {deudas.filter((d) => d.estado === 'activa').length} deudas activas
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs text-slate-400">Cuotas comprometidas ({periodoYm})</span>
          <p className="font-display text-2xl font-bold text-slate-50 tabular-nums mt-1">
            {formatARS(resumen.deudas.total_cuotas_mes)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Sumado al total de obligaciones del mes
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <span className="text-xs text-slate-400">Pagado en deudas ({periodoYm})</span>
          <p className="font-display text-2xl font-bold text-emerald-400 tabular-nums mt-1">
            {formatARS(totalPagadoMes)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {pagosMes.length} {pagosMes.length === 1 ? 'pago registrado' : 'pagos registrados'} este mes
          </span>
        </div>
      </div>

      {/* Create / Edit Debt Form */}
      {showForm && (
        <form
          onSubmit={handleSaveDeuda}
          className="glass-card rounded-3xl p-5 sm:p-6 border-blue-500/35 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base sm:text-lg font-bold text-slate-50">
              {form.id ? 'Editar deuda' : 'Registrar nueva deuda / plan de cuotas'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Cerrar formulario"
              className="btn-ghost"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label htmlFor="deu-acreedor" className="block text-xs font-semibold text-slate-300 mb-1">
                Acreedor / Banco / Persona
              </label>
              <input
                id="deu-acreedor"
                type="text"
                required
                value={form.acreedor}
                onChange={(e) => setForm((p) => ({ ...p, acreedor: e.target.value }))}
                placeholder="Ej: Visa Galicia, Mercado Crédito"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="deu-concepto" className="block text-xs font-semibold text-slate-300 mb-1">
                Concepto
              </label>
              <input
                id="deu-concepto"
                type="text"
                required
                value={form.concepto}
                onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
                placeholder="Ej: Heladera exhibidora, Préstamo"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="deu-ambito" className="block text-xs font-semibold text-slate-300 mb-1">
                Ámbito
              </label>
              <select
                id="deu-ambito"
                value={form.ambito}
                onChange={(e) => setForm((p) => ({ ...p, ambito: e.target.value }))}
                className="input-field"
              >
                <option value="personal">Personal</option>
                <option value="kiosco_extra">Kiosco Extra</option>
              </select>
            </div>

            <div>
              <label htmlFor="deu-prioridad" className="block text-xs font-semibold text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                id="deu-prioridad"
                value={form.prioridad}
                onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}
                className="input-field"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label htmlFor="deu-total" className="block text-xs font-semibold text-slate-300 mb-1">
                Monto total (ARS)
              </label>
              <input
                id="deu-total"
                type="number"
                min="1"
                step="100"
                required
                value={form.monto_total}
                onChange={(e) => handleMontoOrCuotasChange('monto_total', e.target.value)}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-cuotas-tot" className="block text-xs font-semibold text-slate-300 mb-1">
                Cuotas totales
              </label>
              <input
                id="deu-cuotas-tot"
                type="number"
                min="1"
                required
                value={form.cuotas_totales}
                onChange={(e) => handleMontoOrCuotasChange('cuotas_totales', e.target.value)}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-cuotas-pag" className="block text-xs font-semibold text-slate-300 mb-1">
                Cuotas ya pagadas
              </label>
              <input
                id="deu-cuotas-pag"
                type="number"
                min="0"
                value={form.cuotas_pagadas}
                onChange={(e) => handleMontoOrCuotasChange('cuotas_pagadas', e.target.value)}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-cuota-mon" className="block text-xs font-semibold text-slate-300 mb-1">
                Monto de cuota (ARS)
              </label>
              <input
                id="deu-cuota-mon"
                type="number"
                min="0"
                step="100"
                required
                value={form.monto_cuota}
                onChange={(e) => setForm((p) => ({ ...p, monto_cuota: e.target.value }))}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-saldo" className="block text-xs font-semibold text-slate-300 mb-1">
                Saldo pendiente actual (ARS)
              </label>
              <input
                id="deu-saldo"
                type="number"
                min="0"
                step="100"
                value={form.saldo_pendiente}
                onChange={(e) => setForm((p) => ({ ...p, saldo_pendiente: e.target.value }))}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-dia" className="block text-xs font-semibold text-slate-300 mb-1">
                Día vencimiento (1–31)
              </label>
              <input
                id="deu-dia"
                type="number"
                min="1"
                max="31"
                value={form.dia_vencimiento}
                onChange={(e) => setForm((p) => ({ ...p, dia_vencimiento: e.target.value }))}
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="deu-estado" className="block text-xs font-semibold text-slate-300 mb-1">
                Estado
              </label>
              <select
                id="deu-estado"
                value={form.estado}
                onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                className="input-field"
              >
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>

            <div>
              <label htmlFor="deu-inicio" className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha inicio
              </label>
              <input
                id="deu-inicio"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1">
              <label htmlFor="deu-notas" className="block text-xs font-semibold text-slate-300 mb-1">
                Notas (opcional)
              </label>
              <input
                id="deu-notas"
                type="text"
                value={form.notas}
                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                placeholder="Ej: Sin interés · Débito automático"
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{form.id ? 'Guardar cambios' : 'Crear deuda'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filtrar deudas por estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="activa">Solo activas</option>
          <option value="todas">Todas</option>
          <option value="pagada">Pagadas</option>
          <option value="pausada">Pausadas</option>
        </select>

        <select
          aria-label="Filtrar deudas por ámbito"
          value={filterAmbito}
          onChange={(e) => setFilterAmbito(e.target.value)}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="todos">Todos los ámbitos</option>
          <option value="personal">Personal</option>
          <option value="kiosco_extra">Kiosco Extra</option>
        </select>
      </div>

      {/* Debt Cards */}
      {filteredDeudas.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No hay deudas en esta vista"
          description={
            deudas.length === 0
              ? 'Registrá préstamos, tarjetas en cuotas o cuentas pendientes para llevar el progreso mes a mes.'
              : 'Probá cambiando el filtro de estado o ámbito.'
          }
          action={
            deudas.length === 0 ? (
              <button type="button" onClick={openNewDeuda} className="btn-primary">
                <Plus className="h-4 w-4" />
                <span>Cargar primera deuda</span>
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredDeudas.map((d) => {
            const pagadas = toNumber(d.cuotas_pagadas, 0)
            const totales = Math.max(1, toNumber(d.cuotas_totales, 1))
            const pct = Math.min(100, (pagadas / totales) * 100)
            const isPaying = payingDeudaId === d.id
            const isHistoryOpen = expandedHistoryId === d.id
            const pagosEstaDeuda = [
              ...(Array.isArray(d.pagos) ? d.pagos : []),
              ...(pagosPorDeuda.get(d.id) || []),
            ].filter(
              (p, index, arr) => arr.findIndex((x) => x.id === p.id) === index
            )

            return (
              <div key={d.id} className="glass-card rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-slate-50">
                        {d.acreedor}
                      </h3>
                      <AmbitoBadge ambito={d.ambito} />
                      <PrioridadBadge prioridad={d.prioridad} />
                      <StatusBadge
                        variant={
                          d.estado === 'pagada'
                            ? 'positive'
                            : d.estado === 'pausada'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {d.estado === 'pagada'
                          ? 'Saldada'
                          : d.estado === 'pausada'
                            ? 'Pausada'
                            : 'Activa'}
                      </StatusBadge>
                      {d.cuota_pagada_este_mes && d.estado !== 'pagada' && (
                        <StatusBadge variant="positive">
                          Cuota {periodoYm} pagada ({formatARS(d.pagado_este_mes)})
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{d.concepto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cuota: <strong className="text-slate-200 tabular-nums">{formatARS(d.monto_cuota)}</strong>{' '}
                      · Vence día {d.dia_vencimiento || '—'} · Total original:{' '}
                      <span className="tabular-nums">{formatARS(d.monto_total)}</span>
                      {d.notas ? ` · ${d.notas}` : ''}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Saldo pendiente</span>
                    <p className="font-display text-2xl font-bold text-rose-300 tabular-nums">
                      {formatARS(d.saldo_pendiente)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium tabular-nums">
                      Cuotas pagadas: {pagadas} / {totales}
                    </span>
                    <span className="text-slate-400 tabular-nums">{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone={d.estado === 'pagada' || pct >= 100 ? 'positive' : 'info'}
                    heightClass="h-2.5"
                  />
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.estado !== 'pagada' && (
                      <button
                        type="button"
                        onClick={() => (isPaying ? setPayingDeudaId(null) : openPaymentDrawer(d))}
                        className="btn-primary text-xs sm:text-sm"
                      >
                        <Wallet className="h-4 w-4" />
                        <span>Registrar Pago / Cuota</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isHistoryOpen ? null : d.id)}
                      className="btn-secondary text-xs"
                    >
                      <span>
                        Pagos ({pagosEstaDeuda.length})
                      </span>
                      {isHistoryOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditDeuda(d)}
                      aria-label={`Editar deuda ${d.acreedor}`}
                      className="btn-ghost border border-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeuda(d)}
                      aria-label={`Eliminar deuda ${d.acreedor}`}
                      className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Payment Registration Panel */}
                {isPaying && (
                  <form
                    onSubmit={(e) => handleRegistrarPago(e, d)}
                    className="p-4 rounded-2xl bg-slate-950/75 border border-emerald-500/35 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-3">
                      <label htmlFor={`pag-mon-${d.id}`} className="block text-xs font-semibold text-slate-300 mb-1">
                        Monto pagado (ARS)
                      </label>
                      <input
                        id={`pag-mon-${d.id}`}
                        type="number"
                        min="1"
                        step="100"
                        required
                        value={pagoMonto}
                        onChange={(e) => setPagoMonto(e.target.value)}
                        className="input-field tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`pag-num-${d.id}`} className="block text-xs font-semibold text-slate-300 mb-1">
                        N° cuota
                      </label>
                      <input
                        id={`pag-num-${d.id}`}
                        type="number"
                        min="1"
                        value={pagoCuotaNum}
                        onChange={(e) => setPagoCuotaNum(e.target.value)}
                        className="input-field tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`pag-fec-${d.id}`} className="block text-xs font-semibold text-slate-300 mb-1">
                        Fecha pago
                      </label>
                      <input
                        id={`pag-fec-${d.id}`}
                        type="date"
                        value={pagoFecha}
                        onChange={(e) => setPagoFecha(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`pag-not-${d.id}`} className="block text-xs font-semibold text-slate-300 mb-1">
                        Nota (opcional)
                      </label>
                      <input
                        id={`pag-not-${d.id}`}
                        type="text"
                        value={pagoNotas}
                        onChange={(e) => setPagoNotas(e.target.value)}
                        placeholder="Comprobante / medio"
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5">
                      <button type="submit" disabled={saving} className="btn-primary flex-1 px-3">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayingDeudaId(null)}
                        aria-label="Cancelar pago"
                        className="btn-ghost border border-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Payment History with Undo (eliminar_pago) */}
                {isHistoryOpen && (
                  <div className="p-4 rounded-2xl bg-slate-950/65 border border-slate-800 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-300">
                      Historial de pagos registrados en {periodoYm}
                    </p>
                    {pagosEstaDeuda.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Sin pagos registrados en este período para esta deuda.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-800/80">
                        {pagosEstaDeuda.map((pago) => (
                          <li
                            key={pago.id}
                            className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-emerald-300 tabular-nums">
                                {formatARS(pago.monto_pagado)}
                              </span>
                              <span className="text-slate-400 ml-2">
                                {pago.numero_cuota ? `Cuota #${pago.numero_cuota} · ` : ''}
                                {formatDateAR(pago.fecha_pago)}
                                {pago.notas ? ` · ${pago.notas}` : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEliminarPago(pago)}
                              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Deshacer</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DeudasSection
