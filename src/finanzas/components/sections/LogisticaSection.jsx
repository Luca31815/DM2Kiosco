import React, { useState, useMemo } from 'react'
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Info,
  CalendarDays,
  Ban,
  RotateCcw,
  Loader2,
  Tag,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatDateAR, toNumber } from '../../utils/formatters'
import { SectionHeader, StatusBadge, EmptyState } from '../ui/Primitives'

const EMPTY_ARRAY = []

const EMPTY_REGLA = {
  id: null,
  nombre_regla: '',
  tipo_proveedor: 'mayorista',
  proveedor_normalizado: '',
  aliases: [],
  concepto: 'Taxi / Flete',
  monto_fijo: '',
  modo_calculo: 'por_dia',
  vigente_desde: '',
  vigente_hasta: '',
  activo: true,
  notas: '',
}

const LogisticaSection = ({
  resumen,
  proveedoresCatalogo = EMPTY_ARRAY,
  periodoYm,
  onCrudLogistica,
  onRecalcularLogistica,
  busyAction,
}) => {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_REGLA)
  const [aliasInput, setAliasInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Override inline editor for a specific day row
  const [overrideKey, setOverrideKey] = useState(null)
  const [overrideMonto, setOverrideMonto] = useState('')
  const [overrideMotivo, setOverrideMotivo] = useState('')

  const reglas = resumen.logistica.reglas || []
  const diasMes = resumen.logistica.dias_mes || []
  const totalMes = toNumber(resumen.logistica.total_mes, 0)

  const catalogoNormalizado = useMemo(() => {
    const list = proveedoresCatalogo || EMPTY_ARRAY
    const result = []
    for (let i = 0; i < list.length; i += 1) {
      const p = list[i]
      if (typeof p === 'string') {
        if (p) result.push({ nombre: p, compras_60d: null, ultima_compra: null })
      } else if (p) {
        const nombre = p.proveedor_normalizado || p.proveedor || p.nombre || ''
        if (nombre) {
          result.push({
            nombre,
            compras_60d: p.compras_60d ?? p.conteo_60d ?? p.cantidad_compras_60d ?? null,
            monto_60d: p.monto_60d ?? p.monto_total ?? null,
            ultima_compra: p.ultima_compra || null,
            tiene_regla_activa: Boolean(p.tiene_regla_activa),
          })
        }
      }
    }
    return result
  }, [proveedoresCatalogo])

  const aliasesSet = useMemo(() => new Set(form.aliases), [form.aliases])

  const openNewRegla = () => {
    setForm(EMPTY_REGLA)
    setAliasInput('')
    setShowForm(true)
  }

  const openEditRegla = (regla) => {
    setForm({
      id: regla.id,
      nombre_regla: regla.nombre_regla || '',
      tipo_proveedor: regla.tipo_proveedor || 'mayorista',
      proveedor_normalizado: regla.proveedor_normalizado || '',
      aliases: Array.isArray(regla.aliases) ? regla.aliases : [],
      concepto: regla.concepto || 'Taxi / Flete',
      monto_fijo: String(toNumber(regla.monto_fijo, 0)),
      modo_calculo: regla.modo_calculo || 'por_dia',
      vigente_desde: regla.vigente_desde ? String(regla.vigente_desde).slice(0, 10) : '',
      vigente_hasta: regla.vigente_hasta ? String(regla.vigente_hasta).slice(0, 10) : '',
      activo: regla.activo !== false,
      notas: regla.notas || '',
    })
    setAliasInput('')
    setShowForm(true)
  }

  const addAlias = (rawAlias) => {
    const clean = String(rawAlias || '').trim().toUpperCase()
    if (!clean) return
    if (clean === form.proveedor_normalizado.trim().toUpperCase()) {
      toast('Ese nombre ya es el proveedor principal.')
      return
    }
    setForm((prev) => {
      if (prev.aliases.includes(clean)) return prev
      return { ...prev, aliases: [...prev.aliases, clean] }
    })
    setAliasInput('')
  }

  const removeAlias = (target) => {
    setForm((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((a) => a !== target),
    }))
  }

  const handleSaveRegla = async (e) => {
    e.preventDefault()
    const prov = form.proveedor_normalizado.trim().toUpperCase()
    if (!prov) {
      toast.error('Seleccioná o escribí el proveedor principal.')
      return
    }
    const monto = toNumber(form.monto_fijo, -1)
    if (monto < 0) {
      toast.error('Ingresá un monto fijo válido.')
      return
    }
    setSaving(true)
    try {
      await onCrudLogistica('upsert', {
        ...(form.id ? { id: form.id } : {}),
        nombre_regla: form.nombre_regla.trim() || `${form.concepto || 'Logística'} — ${prov}`,
        tipo_proveedor: form.tipo_proveedor || 'mayorista',
        proveedor_normalizado: prov,
        aliases: form.aliases,
        concepto: form.concepto.trim() || 'Taxi / Flete',
        monto_fijo: monto,
        modo_calculo: form.modo_calculo || 'por_dia',
        vigente_desde: form.vigente_desde || null,
        vigente_hasta: form.vigente_hasta || null,
        activo: Boolean(form.activo),
        notas: form.notas.trim() || null,
      })
      setShowForm(false)
      setForm(EMPTY_REGLA)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRegla = async (regla) => {
    if (!window.confirm(`¿Eliminar la regla logística "${regla.nombre_regla || regla.proveedor_normalizado}"?`)) {
      return
    }
    await onCrudLogistica('delete', { id: regla.id })
  }

  const openOverrideEditor = (row, rowKey) => {
    setOverrideKey(rowKey)
    setOverrideMonto(String(toNumber(row.monto_efectivo ?? row.monto_override ?? row.monto_base ?? row.monto_fijo, 0)))
    setOverrideMotivo(row.motivo || row.motivo_override || '')
  }

  const saveOverride = async (row, omitirFlag, fromInlineEditor = true) => {
    const reglaId = row.regla_id ?? row.id
    const fechaDia = String(row.fecha_dia || row.fecha || '').slice(0, 10)
    if (!reglaId || !fechaDia) {
      toast.error('Falta regla_id o fecha_dia para aplicar el override.')
      return
    }
    const cleanMotivo = fromInlineEditor ? overrideMotivo.trim() : ''
    setSaving(true)
    try {
      await onCrudLogistica('set_override', {
        regla_id: reglaId,
        fecha_dia: fechaDia,
        monto_override: omitirFlag ? 0 : toNumber(overrideMonto, 0),
        omitir: Boolean(omitirFlag),
        motivo: cleanMotivo || (omitirFlag ? 'Viaje omitido manualmente' : 'Ajuste manual del día'),
      })
      setOverrideKey(null)
    } finally {
      setSaving(false)
    }
  }

  const restoreDayDefault = async (row) => {
    const reglaId = row.regla_id ?? row.id
    const fechaDia = String(row.fecha_dia || row.fecha || '').slice(0, 10)
    setSaving(true)
    try {
      await onCrudLogistica('set_override', {
        regla_id: reglaId,
        fecha_dia: fechaDia,
        monto_override: null,
        omitir: false,
        eliminar: true,
        motivo: null,
      })
      setOverrideKey(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Logística por Proveedor (1×día)"
        subtitle="Vinculá costos de flete, taxi o traslado a tus proveedores reales de compras sin duplicar cuando cargás varias facturas el mismo día."
        actions={
          <>
            {onRecalcularLogistica && (
              <button
                type="button"
                onClick={onRecalcularLogistica}
                disabled={busyAction === 'logistica'}
                className="btn-secondary"
              >
                <RefreshCw
                  className={`h-4 w-4 ${busyAction === 'logistica' ? 'animate-spin text-blue-400' : ''}`}
                />
                <span>Recalcular mes</span>
              </button>
            )}
            <button type="button" onClick={openNewRegla} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Nueva regla logística</span>
            </button>
          </>
        }
      />

      {/* Educational Callout */}
      <div className="rounded-2xl bg-blue-500/10 border border-blue-500/25 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-100 leading-relaxed">
          <strong className="font-semibold">Regla 1×día (modo por defecto):</strong> descuenta 1
          sola vez por día con pedido aunque haya varias facturas el mismo día para ese proveedor o
          sus aliases. Total computado en <span className="font-mono">{periodoYm}</span>:{' '}
          <strong className="font-display text-white tabular-nums">{formatARS(totalMes)}</strong> (
          {diasMes.length} {diasMes.length === 1 ? 'día detectado' : 'días detectados'}).
        </div>
      </div>

      {/* Create / Edit Rule Form */}
      {showForm && (
        <form
          onSubmit={handleSaveRegla}
          className="glass-card rounded-3xl p-5 sm:p-6 border-blue-500/35 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base sm:text-lg font-bold text-slate-50">
              {form.id ? 'Editar regla de logística' : 'Crear regla de logística'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="log-prov" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proveedor principal (catálogo real)
              </label>
              <input
                id="log-prov"
                type="text"
                list="proveedores-reales-list"
                required
                value={form.proveedor_normalizado}
                onChange={(e) =>
                  setForm((p) => ({ ...p, proveedor_normalizado: e.target.value.toUpperCase() }))
                }
                placeholder="Ej: MAXICONSUMO"
                className="input-field uppercase"
              />
              <datalist id="proveedores-reales-list">
                {catalogoNormalizado.map((p) => (
                  <option key={p.nombre} value={p.nombre}>
                    {p.compras_60d !== null ? `${p.nombre} (${p.compras_60d} compras 60d)` : p.nombre}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="log-nombre" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de la regla
              </label>
              <input
                id="log-nombre"
                type="text"
                value={form.nombre_regla}
                onChange={(e) => setForm((p) => ({ ...p, nombre_regla: e.target.value }))}
                placeholder="Ej: Flete Mayorista Centro"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="log-concepto" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Concepto
              </label>
              <input
                id="log-concepto"
                type="text"
                required
                value={form.concepto}
                onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
                placeholder="Taxi / Flete"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="log-monto" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto fijo por viaje (ARS)
              </label>
              <input
                id="log-monto"
                type="number"
                min="0"
                step="100"
                required
                value={form.monto_fijo}
                onChange={(e) => setForm((p) => ({ ...p, monto_fijo: e.target.value }))}
                placeholder="8500"
                className="input-field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="log-modo" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Modo de cálculo
              </label>
              <select
                id="log-modo"
                value={form.modo_calculo}
                onChange={(e) => setForm((p) => ({ ...p, modo_calculo: e.target.value }))}
                className="input-field"
              >
                <option value="por_dia">
                  1×día — descuenta 1 sola vez por día con pedido aunque haya varias facturas
                </option>
                <option value="por_compra">Por compra — descuenta en cada factura cargada</option>
              </select>
            </div>

            <div>
              <label htmlFor="log-tipo" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de proveedor
              </label>
              <select
                id="log-tipo"
                value={form.tipo_proveedor}
                onChange={(e) => setForm((p) => ({ ...p, tipo_proveedor: e.target.value }))}
                className="input-field"
              >
                <option value="mayorista">Mayorista</option>
                <option value="distribuidora">Distribuidora</option>
                <option value="flete">Flete / Transporte</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Aliases Chips Selector */}
          <div className="p-4 rounded-2xl bg-slate-950/65 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="log-alias-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-blue-400" />
                <span>Aliases de proveedor (variantes del nombre en compras)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Agrupa distintas escrituras del mismo mayorista
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="log-alias-input"
                type="text"
                list="proveedores-reales-list"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAlias(aliasInput)
                  }
                }}
                placeholder="Elegí del catálogo o escribí un alias y presioná Agregar..."
                className="input-field uppercase flex-1"
              />
              <button
                type="button"
                onClick={() => addAlias(aliasInput)}
                className="btn-secondary shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar alias</span>
              </button>
            </div>

            {form.aliases.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/35 text-blue-200 text-xs font-medium"
                  >
                    <span>{alias}</span>
                    <button
                      type="button"
                      onClick={() => removeAlias(alias)}
                      aria-label={`Quitar alias ${alias}`}
                      className="h-6 w-6 rounded-full inline-flex items-center justify-center hover:bg-blue-500/30 text-blue-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {catalogoNormalizado.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Proveedores frecuentes en los últimos 60 días (tocá para sumar como alias):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {catalogoNormalizado.slice(0, 14).map((p) => {
                    const alreadyUsed =
                      p.nombre === form.proveedor_normalizado || aliasesSet.has(p.nombre)
                    return (
                      <button
                        key={p.nombre}
                        type="button"
                        disabled={alreadyUsed}
                        onClick={() => addAlias(p.nombre)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          alreadyUsed
                            ? 'bg-slate-900 border-slate-800 text-slate-500'
                            : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-blue-500/50 hover:text-white'
                        }`}
                      >
                        + {p.nombre}
                        {p.compras_60d !== null ? ` (${p.compras_60d})` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Vigencia & Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="log-desde" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vigente desde (opcional)
              </label>
              <input
                id="log-desde"
                type="date"
                value={form.vigente_desde}
                onChange={(e) => setForm((p) => ({ ...p, vigente_desde: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="log-hasta" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vigente hasta (opcional)
              </label>
              <input
                id="log-hasta"
                type="date"
                value={form.vigente_hasta}
                onChange={(e) => setForm((p) => ({ ...p, vigente_hasta: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="log-notas" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notas (opcional)
              </label>
              <input
                id="log-notas"
                type="text"
                value={form.notas}
                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                placeholder="Ej: Remís ida y vuelta"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                className="h-4 w-4 accent-blue-500 rounded"
              />
              <span>Regla activa</span>
            </label>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{form.id ? 'Guardar regla' : 'Crear regla'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Rules Grid */}
      <div className="space-y-3">
        <h3 className="font-display text-base font-bold text-slate-100">
          Reglas configuradas ({reglas.length})
        </h3>
        {reglas.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin reglas de logística todavía"
            description="Creá una regla para tu mayorista (ej. Taxi / Flete $8.500) y el sistema detectará automáticamente los días con compras."
            action={
              <button type="button" onClick={openNewRegla} className="btn-primary">
                <Plus className="h-4 w-4" />
                <span>Crear primera regla</span>
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reglas.map((regla) => (
              <div
                key={regla.id}
                className={`glass-card rounded-2xl p-4 space-y-3 ${
                  regla.activo === false ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-bold text-slate-100 truncate">
                        {regla.nombre_regla || regla.proveedor_normalizado}
                      </p>
                      <StatusBadge variant={regla.modo_calculo === 'por_dia' ? 'info' : 'warning'}>
                        {regla.modo_calculo === 'por_dia' ? '1×día' : 'Por compra'}
                      </StatusBadge>
                      {regla.activo === false && <StatusBadge variant="neutral">Pausada</StatusBadge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Proveedor: <strong className="text-slate-200">{regla.proveedor_normalizado}</strong> ·{' '}
                      {regla.concepto || 'Logística'}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold text-slate-50 tabular-nums shrink-0">
                    {formatARS(regla.monto_fijo)}
                  </p>
                </div>

                {Array.isArray(regla.aliases) && regla.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {regla.aliases.map((al) => (
                      <span
                        key={al}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300"
                      >
                        {al}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="min-w-0">
                    <span className="block truncate">
                      {regla.vigente_desde || regla.vigente_hasta
                        ? `Vigencia: ${regla.vigente_desde ? formatDateAR(regla.vigente_desde) : 'inicio'} → ${
                            regla.vigente_hasta ? formatDateAR(regla.vigente_hasta) : 'actual'
                          }`
                        : 'Vigencia permanente'}
                    </span>
                    {toNumber(regla.dias_computados_mes, 0) > 0 && (
                      <span className="text-[11px] text-blue-300 tabular-nums">
                        {regla.dias_computados_mes}{' '}
                        {toNumber(regla.dias_computados_mes) === 1 ? 'día' : 'días'} en {periodoYm} ·{' '}
                        {formatARS(regla.total_logistica_mes)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditRegla(regla)}
                      aria-label={`Editar regla ${regla.nombre_regla}`}
                      className="btn-ghost border border-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRegla(regla)}
                      aria-label={`Eliminar regla ${regla.nombre_regla}`}
                      className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table of Days Computed in Selected Month + Daily Override */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            <span>Viajes computados en {periodoYm}</span>
          </h3>
          <span className="text-xs text-slate-400">
            Podés editar el monto u omitir un día puntual con Override diario
          </span>
        </div>

        {diasMes.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`Sin días de logística en ${periodoYm}`}
            description="Cuando haya compras registradas en el kiosco que coincidan con tus reglas activas, aparecerán acá deduplicadas 1×día."
          />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/75 text-xs text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Fecha</th>
                    <th className="py-3.5 px-4 font-semibold">Regla / Proveedor</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Facturas día</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Monto efectivo</th>
                    <th className="py-3.5 px-4 font-semibold">Estado</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Override diario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {diasMes.map((row, idx) => {
                    const rowKey = `${row.regla_id}-${row.fecha_dia || row.fecha}-${idx}`
                    const isEditing = overrideKey === rowKey
                    const isOmitido = Boolean(row.omitir || row.omitido)
                    const hasOverride =
                      isOmitido ||
                      (row.monto_override !== null && row.monto_override !== undefined) ||
                      Boolean(row.tiene_override)
                    const cantCompras = toNumber(row.cantidad_compras ?? row.compras_dia ?? 1, 1)
                    const montoEfectivo = toNumber(
                      row.monto_efectivo ?? row.monto_computado ?? row.monto_aplicado ?? row.monto_fijo,
                      0
                    )

                    return (
                      <React.Fragment key={rowKey}>
                        <tr className={isOmitido ? 'opacity-60' : 'hover:bg-slate-900/45'}>
                          <td className="py-3 px-4 font-mono text-xs text-slate-200 whitespace-nowrap">
                            {formatDateAR(row.fecha_dia || row.fecha)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-100">
                              {row.nombre_regla || row.proveedor_normalizado}
                            </p>
                            <p className="text-xs text-slate-400">
                              {row.concepto || 'Logística'}
                              {row.motivo || row.motivo_override
                                ? ` · ${row.motivo || row.motivo_override}`
                                : ''}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge variant={cantCompras > 1 ? 'positive' : 'neutral'}>
                              {cantCompras} {cantCompras === 1 ? 'compra' : 'compras → 1 viaje'}
                            </StatusBadge>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold tabular-nums text-slate-50 whitespace-nowrap">
                            {isOmitido ? (
                              <span className="line-through text-slate-500">
                                {formatARS(row.monto_base ?? row.monto_fijo)}
                              </span>
                            ) : (
                              formatARS(montoEfectivo)
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isOmitido ? (
                              <StatusBadge variant="danger">Omitido</StatusBadge>
                            ) : hasOverride ? (
                              <StatusBadge variant="warning">Override</StatusBadge>
                            ) : (
                              <StatusBadge variant="positive">Calculado</StatusBadge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  isEditing ? setOverrideKey(null) : openOverrideEditor(row, rowKey)
                                }
                                aria-label="Editar monto de este día"
                                className="btn-ghost border border-slate-800 text-xs"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Editar</span>
                              </button>
                              {isOmitido || hasOverride ? (
                                <button
                                  type="button"
                                  onClick={() => restoreDayDefault(row)}
                                  aria-label="Restaurar monto automático del día"
                                  className="btn-ghost border border-slate-800 text-xs text-blue-300"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Restaurar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => saveOverride(row, true, false)}
                                  aria-label="Omitir este día"
                                  className="btn-ghost border border-slate-800 text-xs text-rose-300 hover:bg-rose-500/10"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Omitir</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr className="bg-slate-950/75">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                <div className="sm:col-span-3">
                                  <label
                                    htmlFor={`ovr-monto-${rowKey}`}
                                    className="block text-xs font-semibold text-slate-300 mb-1"
                                  >
                                    Monto real ese día (ARS)
                                  </label>
                                  <input
                                    id={`ovr-monto-${rowKey}`}
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={overrideMonto}
                                    onChange={(e) => setOverrideMonto(e.target.value)}
                                    className="input-field tabular-nums"
                                  />
                                </div>
                                <div className="sm:col-span-5">
                                  <label
                                    htmlFor={`ovr-motivo-${rowKey}`}
                                    className="block text-xs font-semibold text-slate-300 mb-1"
                                  >
                                    Motivo del override
                                  </label>
                                  <input
                                    id={`ovr-motivo-${rowKey}`}
                                    type="text"
                                    value={overrideMotivo}
                                    onChange={(e) => setOverrideMotivo(e.target.value)}
                                    placeholder="Ej: Me alcanzó un amigo / Flete compartido"
                                    className="input-field"
                                  />
                                </div>
                                <div className="sm:col-span-4 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => saveOverride(row, false)}
                                    className="btn-primary flex-1"
                                  >
                                    {saving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                    <span>Guardar monto</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => saveOverride(row, true)}
                                    className="btn-secondary text-rose-300 border-rose-500/35"
                                  >
                                    Omitir día
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOverrideKey(null)}
                                    aria-label="Cancelar"
                                    className="btn-ghost border border-slate-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(LogisticaSection)
