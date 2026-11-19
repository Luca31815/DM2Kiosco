import React, { useState, useMemo } from 'react'
import {
  Repeat,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatDateAR, toNumber } from '../../utils/formatters'
import { filterGastosRecurrentes } from '../../utils/finanzasFilters'
import {
  SectionHeader,
  StatusBadge,
  AmbitoBadge,
  PrioridadBadge,
  ProgressBar,
  EmptyState,
} from '../ui/Primitives'

const EMPTY_PLANTILLA = {
  id: null,
  nombre: '',
  categoria: 'Servicios',
  ambito: 'personal',
  monto_base: '',
  dia_vencimiento: '10',
  prioridad: 'alta',
  activo: true,
}

const CATEGORIAS_SUGERIDAS = [
  'Alquiler',
  'Servicios',
  'Impuestos',
  'Internet / Telefonía',
  'Seguros',
  'Salud',
  'Suscripciones',
  'Educación',
  'Kiosco Fijo',
  'Otros',
]

const GastosRecurrentesSection = ({
  resumen,
  periodoYm,
  onGenerarMes,
  onCrudGasto,
  busyAction,
}) => {
  const [subTab, setSubTab] = useState('checklist') // 'checklist' | 'plantillas'
  const [ambitoFilter, setAmbitoFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')

  // Inline edit state for a monthly instance
  const [editingId, setEditingId] = useState(null)
  const [editMontoReal, setEditMontoReal] = useState('')
  const [editMontoEsperado, setEditMontoEsperado] = useState('')
  const [editNotas, setEditNotas] = useState('')

  // Plantilla form state
  const [showPlantillaForm, setShowPlantillaForm] = useState(false)
  const [plantillaForm, setPlantillaForm] = useState(EMPTY_PLANTILLA)
  const [saving, setSaving] = useState(false)

  const recurrentesMes = useMemo(
    () => (resumen.gastos.items || []).filter((g) => Boolean(g.es_recurrente)),
    [resumen.gastos.items]
  )

  const filteredChecklist = useMemo(
    () =>
      filterGastosRecurrentes(recurrentesMes, {
        ambito: ambitoFilter,
        estado: estadoFilter,
      }),
    [recurrentesMes, ambitoFilter, estadoFilter]
  )

  const stats = useMemo(() => {
    const total = recurrentesMes.reduce(
      (acc, g) => acc + toNumber(g.monto_real ?? g.monto_esperado, 0),
      0
    )
    const pagado = recurrentesMes
      .filter((g) => g.estado_pago === 'pagado')
      .reduce((acc, g) => acc + toNumber(g.monto_real ?? g.monto_esperado, 0), 0)
    const countPagados = recurrentesMes.filter((g) => g.estado_pago === 'pagado').length
    const pct = total > 0 ? (pagado / total) * 100 : 0
    return { total, pagado, faltante: Math.max(0, total - pagado), countPagados, pct }
  }, [recurrentesMes])

  const handleToggleEstado = async (item) => {
    const nextEstado = item.estado_pago === 'pagado' ? 'pendiente' : 'pagado'
    await onCrudGasto('toggle_estado', {
      id: item.id,
      estado_pago: nextEstado,
    })
  }

  const startInlineEdit = (item) => {
    setEditingId(item.id)
    setEditMontoReal(String(toNumber(item.monto_real ?? item.monto_esperado, 0)))
    setEditMontoEsperado(String(toNumber(item.monto_esperado, 0)))
    setEditNotas(item.notas || '')
  }

  const saveInlineEdit = async (item) => {
    const realNum = toNumber(editMontoReal, -1)
    const espNum = toNumber(editMontoEsperado, -1)
    if (realNum < 0 || espNum < 0) {
      toast.error('Los montos deben ser números válidos mayores o iguales a 0.')
      return
    }
    setSaving(true)
    try {
      await onCrudGasto('upsert_mensual', {
        id: item.id,
        periodo_ym: periodoYm,
        plantilla_id: item.plantilla_id ?? null,
        nombre: item.nombre,
        categoria: item.categoria,
        ambito: item.ambito,
        es_recurrente: true,
        monto_esperado: espNum,
        monto_real: realNum,
        estado_pago: item.estado_pago,
        fecha_vencimiento: item.fecha_vencimiento || null,
        fecha_pago: item.fecha_pago || null,
        notas: editNotas.trim() || null,
      })
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMensual = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}" solo del mes ${periodoYm}?`)) return
    await onCrudGasto('delete_mensual', { id: item.id })
  }

  const openNewPlantilla = () => {
    setPlantillaForm(EMPTY_PLANTILLA)
    setShowPlantillaForm(true)
    setSubTab('plantillas')
  }

  const openEditPlantilla = (pl) => {
    setPlantillaForm({
      id: pl.id,
      nombre: pl.nombre || '',
      categoria: pl.categoria || 'Servicios',
      ambito: pl.ambito || 'personal',
      monto_base: String(toNumber(pl.monto_base, 0)),
      dia_vencimiento: String(pl.dia_vencimiento ?? 10),
      prioridad: pl.prioridad || 'alta',
      activo: pl.activo !== false,
    })
    setShowPlantillaForm(true)
    setSubTab('plantillas')
  }

  const handleSavePlantilla = async (e) => {
    e.preventDefault()
    if (!plantillaForm.nombre.trim()) {
      toast.error('Ingresá un nombre para la plantilla.')
      return
    }
    const monto = toNumber(plantillaForm.monto_base, -1)
    if (monto < 0) {
      toast.error('Ingresá un monto base válido.')
      return
    }
    const dia = Math.min(31, Math.max(1, parseInt(plantillaForm.dia_vencimiento, 10) || 1))
    setSaving(true)
    try {
      await onCrudGasto('upsert_plantilla', {
        ...(plantillaForm.id ? { id: plantillaForm.id } : {}),
        nombre: plantillaForm.nombre.trim(),
        categoria: plantillaForm.categoria.trim() || 'Otros',
        ambito: plantillaForm.ambito,
        monto_base: monto,
        dia_vencimiento: dia,
        prioridad: plantillaForm.prioridad,
        activo: Boolean(plantillaForm.activo),
      })
      setShowPlantillaForm(false)
      setPlantillaForm(EMPTY_PLANTILLA)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlantilla = async (pl) => {
    if (!window.confirm(`¿Eliminar la plantilla "${pl.nombre}"? No borrará meses ya registrados.`)) {
      return
    }
    await onCrudGasto('delete_plantilla', { id: pl.id })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gastos Recurrentes"
        subtitle="A los que hay que llegar cada mes. Editá el monto real de este mes sin alterar plantillas ni historial previo."
        actions={
          <>
            <button
              type="button"
              onClick={onGenerarMes}
              disabled={busyAction === 'generar'}
              className="btn-secondary"
            >
              {busyAction === 'generar' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-400" />
              )}
              <span>Generar / Sincronizar Mes</span>
            </button>
            <button type="button" onClick={openNewPlantilla} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Nueva plantilla</span>
            </button>
          </>
        }
      />

      {/* Progress Strip */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-xs text-slate-400">Total recurrentes</span>
            <p className="font-display text-lg font-bold text-slate-50 tabular-nums mt-0.5">
              {formatARS(stats.total)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Pagado</span>
            <p className="font-display text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
              {formatARS(stats.pagado)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Faltante</span>
            <p className="font-display text-lg font-bold text-amber-300 tabular-nums mt-0.5">
              {formatARS(stats.faltante)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Checklist</span>
            <p className="font-display text-lg font-bold text-slate-100 tabular-nums mt-0.5">
              {stats.countPagados} / {recurrentesMes.length} pagos
            </p>
          </div>
        </div>
        <ProgressBar value={stats.pct} tone="positive" heightClass="h-2" />
      </div>

      {/* Sub-tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setSubTab('checklist')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'checklist'
                ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Checklist {periodoYm} ({recurrentesMes.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('plantillas')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'plantillas'
                ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Plantillas ({resumen.gastos.plantillas.length})
          </button>
        </div>

        {subTab === 'checklist' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <select
              aria-label="Filtrar por ámbito"
              value={ambitoFilter}
              onChange={(e) => setAmbitoFilter(e.target.value)}
              className="input-field w-auto min-w-[140px] py-2 text-xs"
            >
              <option value="todos">Todos los ámbitos</option>
              <option value="personal">Personal</option>
              <option value="kiosco_extra">Kiosco Extra</option>
            </select>
            <select
              aria-label="Filtrar por estado de pago"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="input-field w-auto min-w-[135px] py-2 text-xs"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagados</option>
            </select>
          </div>
        )}
      </div>

      {/* Sub-view 1: Checklist del Mes */}
      {subTab === 'checklist' && (
        <>
          {filteredChecklist.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No hay gastos recurrentes en esta vista"
              description={
                recurrentesMes.length === 0
                  ? 'Creá tus plantillas (alquiler, luz, internet, impuestos) y tocá "Generar / Sincronizar Mes" para poblar el checklist.'
                  : 'Probá limpiando los filtros de ámbito o estado.'
              }
              action={
                recurrentesMes.length === 0 ? (
                  <button type="button" onClick={onGenerarMes} className="btn-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Sincronizar mes {periodoYm}</span>
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-2.5">
              {filteredChecklist.map((item) => {
                const isPagado = item.estado_pago === 'pagado'
                const isEditing = editingId === item.id
                const montoEfectivo = toNumber(item.monto_real ?? item.monto_esperado, 0)

                return (
                  <div
                    key={item.id}
                    className={`glass-card rounded-2xl p-4 transition-all ${
                      isPagado ? 'opacity-80 border-emerald-500/20' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(item)}
                          aria-label={
                            isPagado
                              ? `Marcar ${item.nombre} como pendiente`
                              : `Marcar ${item.nombre} como pagado`
                          }
                          className={`touch-target inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
                            isPagado
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-300'
                          }`}
                        >
                          {isPagado ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm sm:text-base font-semibold ${
                                isPagado ? 'line-through text-slate-400' : 'text-slate-100'
                              }`}
                            >
                              {item.nombre}
                            </p>
                            <AmbitoBadge ambito={item.ambito} />
                            {item.prioridad && <PrioridadBadge prioridad={item.prioridad} />}
                            <StatusBadge variant="neutral">{item.categoria || 'General'}</StatusBadge>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Vence: {formatDateAR(item.fecha_vencimiento)}
                            {item.fecha_pago && isPagado ? ` · Pagado el ${formatDateAR(item.fecha_pago)}` : ''}
                            {item.notas ? ` · ${item.notas}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pl-[56px] sm:pl-0">
                        <div className="text-left sm:text-right mr-1">
                          <p className="font-display text-base sm:text-lg font-bold text-slate-50 tabular-nums">
                            {formatARS(montoEfectivo)}
                          </p>
                          {item.monto_real !== null &&
                            item.monto_real !== undefined &&
                            toNumber(item.monto_real) !== toNumber(item.monto_esperado) && (
                              <p className="text-[11px] text-slate-400 tabular-nums">
                                Base: {formatARS(item.monto_esperado)}
                              </p>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() => (isEditing ? setEditingId(null) : startInlineEdit(item))}
                          aria-label={`Editar monto real de ${item.nombre}`}
                          className="btn-ghost border border-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMensual(item)}
                          aria-label={`Eliminar ${item.nombre} de este mes`}
                          className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3">
                          <label
                            htmlFor={`edit-real-${item.id}`}
                            className="block text-xs font-semibold text-slate-300 mb-1"
                          >
                            Monto real ({periodoYm})
                          </label>
                          <input
                            id={`edit-real-${item.id}`}
                            type="number"
                            min="0"
                            step="100"
                            value={editMontoReal}
                            onChange={(e) => setEditMontoReal(e.target.value)}
                            className="input-field tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label
                            htmlFor={`edit-esp-${item.id}`}
                            className="block text-xs font-semibold text-slate-300 mb-1"
                          >
                            Monto esperado
                          </label>
                          <input
                            id={`edit-esp-${item.id}`}
                            type="number"
                            min="0"
                            step="100"
                            value={editMontoEsperado}
                            onChange={(e) => setEditMontoEsperado(e.target.value)}
                            className="input-field tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label
                            htmlFor={`edit-notas-${item.id}`}
                            className="block text-xs font-semibold text-slate-300 mb-1"
                          >
                            Nota de este mes
                          </label>
                          <input
                            id={`edit-notas-${item.id}`}
                            type="text"
                            value={editNotas}
                            onChange={(e) => setEditNotas(e.target.value)}
                            placeholder="Solo aplica a este mes"
                            className="input-field"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveInlineEdit(item)}
                            className="btn-primary flex-1 px-3"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancelar edición"
                            className="btn-ghost border border-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Sub-view 2: Plantillas */}
      {subTab === 'plantillas' && (
        <div className="space-y-4">
          {showPlantillaForm && (
            <form
              onSubmit={handleSavePlantilla}
              className="glass-card rounded-3xl p-5 border-blue-500/35 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-100">
                  {plantillaForm.id ? 'Editar plantilla recurrente' : 'Nueva plantilla recurrente'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPlantillaForm(false)}
                  aria-label="Cerrar formulario"
                  className="btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="pl-nombre" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre del gasto
                  </label>
                  <input
                    id="pl-nombre"
                    type="text"
                    required
                    value={plantillaForm.nombre}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Alquiler local, Luz Edesur, Monotributo"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="pl-categoria" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoría
                  </label>
                  <input
                    id="pl-categoria"
                    type="text"
                    list="categorias-gastos-list"
                    value={plantillaForm.categoria}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, categoria: e.target.value }))}
                    className="input-field"
                  />
                  <datalist id="categorias-gastos-list">
                    {CATEGORIAS_SUGERIDAS.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="pl-ambito" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ámbito
                  </label>
                  <select
                    id="pl-ambito"
                    value={plantillaForm.ambito}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, ambito: e.target.value }))}
                    className="input-field"
                  >
                    <option value="personal">Personal</option>
                    <option value="kiosco_extra">Kiosco Extra</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pl-monto" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Monto base mensual (ARS)
                  </label>
                  <input
                    id="pl-monto"
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={plantillaForm.monto_base}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, monto_base: e.target.value }))}
                    placeholder="150000"
                    className="input-field tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="pl-dia" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Día de vencimiento (1–31)
                  </label>
                  <input
                    id="pl-dia"
                    type="number"
                    min="1"
                    max="31"
                    value={plantillaForm.dia_vencimiento}
                    onChange={(e) =>
                      setPlantillaForm((p) => ({ ...p, dia_vencimiento: e.target.value }))
                    }
                    className="input-field tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="pl-prioridad" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    id="pl-prioridad"
                    value={plantillaForm.prioridad}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, prioridad: e.target.value }))}
                    className="input-field"
                  >
                    <option value="alta">Alta (vital)</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={plantillaForm.activo}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, activo: e.target.checked }))}
                    className="h-4 w-4 accent-blue-500 rounded"
                  />
                  <span>Plantilla activa (se incluye al generar cada mes)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPlantillaForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>{plantillaForm.id ? 'Guardar cambios' : 'Crear plantilla'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {resumen.gastos.plantillas.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="Sin plantillas recurrentes"
              description="Cargá tus obligaciones mensuales fijas una sola vez y sincronizalas en segundos cada mes."
              action={
                <button type="button" onClick={openNewPlantilla} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  <span>Crear primera plantilla</span>
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {resumen.gastos.plantillas.map((pl) => (
                <div
                  key={pl.id}
                  className={`glass-card rounded-2xl p-4 flex items-center justify-between gap-3 ${
                    pl.activo === false ? 'opacity-60' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">{pl.nombre}</p>
                      <AmbitoBadge ambito={pl.ambito} />
                      <PrioridadBadge prioridad={pl.prioridad} />
                      {pl.activo === false && <StatusBadge variant="neutral">Inactiva</StatusBadge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {pl.categoria || 'General'} · Vence día {pl.dia_vencimiento || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-display font-bold text-sm text-slate-50 tabular-nums mr-1">
                      {formatARS(pl.monto_base)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditPlantilla(pl)}
                      aria-label={`Editar plantilla ${pl.nombre}`}
                      className="btn-ghost border border-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlantilla(pl)}
                      aria-label={`Eliminar plantilla ${pl.nombre}`}
                      className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GastosRecurrentesSection
