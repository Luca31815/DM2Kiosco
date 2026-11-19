import React, { useState, useMemo } from 'react'
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatDateAR, getTodayISOAR, toNumber } from '../../utils/formatters'
import { filterGastosEspecificos } from '../../utils/finanzasFilters'
import { SectionHeader, StatusBadge, AmbitoBadge, EmptyState } from '../ui/Primitives'

const CATEGORIAS_EVENTUALES = [
  'Imprevisto',
  'Mantenimiento',
  'Salud',
  'Hogar',
  'Insumos',
  'Impuestos',
  'Regalos / Salidas',
  'Otros',
]

const GastosEspecificosSection = ({ resumen, periodoYm, onCrudGasto }) => {
  // Quick-add 10s form
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [ambito, setAmbito] = useState('personal')
  const [categoria, setCategoria] = useState('Imprevisto')
  const [estadoPago, setEstadoPago] = useState('pagado')
  const [fecha, setFecha] = useState(getTodayISOAR())
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Filters (4 quadrants safe)
  const [filterAmbito, setFilterAmbito] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [searchText, setSearchText] = useState('')

  // Inline edit
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', monto_real: '', categoria: '', ambito: 'personal', notas: '' })

  const especificos = useMemo(
    () => (resumen.gastos.items || []).filter((g) => !g.es_recurrente),
    [resumen.gastos.items]
  )

  const categoriasDisponibles = useMemo(() => {
    const set = new Set(CATEGORIAS_EVENTUALES)
    especificos.forEach((g) => {
      if (g.categoria) set.add(g.categoria)
    })
    return Array.from(set).sort()
  }, [especificos])

  const filteredItems = useMemo(
    () =>
      filterGastosEspecificos(especificos, {
        ambito: filterAmbito,
        categoria: filterCategoria,
        search: searchText,
      }),
    [especificos, filterAmbito, filterCategoria, searchText]
  )

  const totalFiltrado = useMemo(
    () => filteredItems.reduce((acc, item) => acc + toNumber(item.monto_real ?? item.monto_esperado, 0), 0),
    [filteredItems]
  )

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('Escribí el concepto del gasto.')
      return
    }
    const montoNum = toNumber(monto, -1)
    if (montoNum <= 0) {
      toast.error('Ingresá un monto mayor a 0.')
      return
    }
    setSubmitting(true)
    try {
      await onCrudGasto('upsert_mensual', {
        periodo_ym: periodoYm,
        plantilla_id: null,
        nombre: nombre.trim(),
        categoria: categoria.trim() || 'Imprevisto',
        ambito,
        es_recurrente: false,
        monto_esperado: montoNum,
        monto_real: montoNum,
        estado_pago: estadoPago,
        fecha_vencimiento: fecha || null,
        fecha_pago: estadoPago === 'pagado' ? fecha || getTodayISOAR() : null,
        notas: notas.trim() || null,
      })
      setNombre('')
      setMonto('')
      setNotas('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEstado = async (item) => {
    await onCrudGasto('toggle_estado', {
      id: item.id,
      estado_pago: item.estado_pago === 'pagado' ? 'pendiente' : 'pagado',
    })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      nombre: item.nombre || '',
      monto_real: String(toNumber(item.monto_real ?? item.monto_esperado, 0)),
      categoria: item.categoria || 'Imprevisto',
      ambito: item.ambito || 'personal',
      notas: item.notas || '',
    })
  }

  const saveEdit = async (item) => {
    const num = toNumber(editForm.monto_real, -1)
    if (!editForm.nombre.trim() || num < 0) {
      toast.error('Verificá nombre y monto.')
      return
    }
    setSubmitting(true)
    try {
      await onCrudGasto('upsert_mensual', {
        id: item.id,
        periodo_ym: periodoYm,
        plantilla_id: null,
        nombre: editForm.nombre.trim(),
        categoria: editForm.categoria.trim() || 'Imprevisto',
        ambito: editForm.ambito,
        es_recurrente: false,
        monto_esperado: num,
        monto_real: num,
        estado_pago: item.estado_pago,
        fecha_vencimiento: item.fecha_vencimiento || null,
        fecha_pago: item.fecha_pago || null,
        notas: editForm.notas.trim() || null,
      })
      setEditingId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar el gasto "${item.nombre}"?`)) return
    await onCrudGasto('delete_mensual', { id: item.id })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gastos Específicos del Mes"
        subtitle="Alta rápida en 10 segundos para gastos eventuales, reparaciones o imprevistos que no son recurrentes."
      />

      {/* Quick Add 10s Form */}
      <form
        onSubmit={handleQuickAdd}
        className="glass-card rounded-3xl p-5 border-blue-500/25 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-display font-semibold text-slate-100">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Carga rápida en {periodoYm}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label htmlFor="esp-nombre" className="block text-xs font-semibold text-slate-300 mb-1">
              Concepto
            </label>
            <input
              id="esp-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Arreglo heladera, Farmacia, Batería"
              className="input-field"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="esp-monto" className="block text-xs font-semibold text-slate-300 mb-1">
              Monto (ARS)
            </label>
            <input
              id="esp-monto"
              type="number"
              min="1"
              step="100"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="25000"
              className="input-field tabular-nums"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="esp-ambito" className="block text-xs font-semibold text-slate-300 mb-1">
              Ámbito
            </label>
            <select
              id="esp-ambito"
              value={ambito}
              onChange={(e) => setAmbito(e.target.value)}
              className="input-field"
            >
              <option value="personal">Personal</option>
              <option value="kiosco_extra">Kiosco Extra</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="esp-categoria" className="block text-xs font-semibold text-slate-300 mb-1">
              Categoría
            </label>
            <select
              id="esp-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="input-field"
            >
              {CATEGORIAS_EVENTUALES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="esp-estado" className="block text-xs font-semibold text-slate-300 mb-1">
              Estado
            </label>
            <select
              id="esp-estado"
              value={estadoPago}
              onChange={(e) => setEstadoPago(e.target.value)}
              className="input-field"
            >
              <option value="pagado">Ya pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label htmlFor="esp-fecha" className="block text-xs font-semibold text-slate-300 mb-1">
              Fecha
            </label>
            <input
              id="esp-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="esp-notas" className="block text-xs font-semibold text-slate-300 mb-1">
              Nota breve (opcional)
            </label>
            <input
              id="esp-notas"
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Pago con débito / efectivo"
              className="input-field"
            />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Agregar gasto</span>
            </button>
          </div>
        </div>
      </form>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Buscar gasto específico"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar concepto o nota..."
              className="input-field pl-10"
            />
          </div>

          <select
            aria-label="Filtrar gastos específicos por ámbito"
            value={filterAmbito}
            onChange={(e) => setFilterAmbito(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="todos">Todos los ámbitos</option>
            <option value="personal">Personal</option>
            <option value="kiosco_extra">Kiosco Extra</option>
          </select>

          <select
            aria-label="Filtrar gastos específicos por categoría"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="input-field w-auto min-w-[155px]"
          >
            <option value="todas">Todas las categorías</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-slate-300 shrink-0 tabular-nums">
          Subtotal vista: <strong className="text-slate-50 font-display">{formatARS(totalFiltrado)}</strong> ({filteredItems.length})
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin gastos específicos en esta vista"
          description={
            especificos.length === 0
              ? 'Todavía no cargaste eventuales ni imprevistos este mes. Usá el formulario de arriba para registrar uno.'
              : 'No hay resultados con los filtros actuales.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isPagado = item.estado_pago === 'pagado'
            const isEditing = editingId === item.id
            return (
              <div key={item.id} className="glass-card rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(item)}
                      aria-label={isPagado ? 'Marcar pendiente' : 'Marcar pagado'}
                      className={`touch-target inline-flex items-center justify-center rounded-xl border cursor-pointer shrink-0 transition-colors ${
                        isPagado
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-blue-500'
                      }`}
                    >
                      {isPagado ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm sm:text-base font-semibold text-slate-100">
                          {item.nombre}
                        </p>
                        <AmbitoBadge ambito={item.ambito} />
                        <StatusBadge variant="neutral">{item.categoria || 'Otros'}</StatusBadge>
                        <StatusBadge variant={isPagado ? 'positive' : 'warning'}>
                          {isPagado ? 'Pagado' : 'Pendiente'}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDateAR(item.fecha_pago || item.fecha_vencimiento)}
                        {item.notas ? ` · ${item.notas}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pl-[56px] sm:pl-0">
                    <span className="font-display text-base sm:text-lg font-bold text-slate-50 tabular-nums mr-1">
                      {formatARS(item.monto_real ?? item.monto_esperado)}
                    </span>
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(item))}
                      aria-label={`Editar ${item.nombre}`}
                      className="btn-ghost border border-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      aria-label={`Eliminar ${item.nombre}`}
                      className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3">
                      <label htmlFor={`edit-esp-nom-${item.id}`} className="block text-xs text-slate-300 mb-1">
                        Concepto
                      </label>
                      <input
                        id={`edit-esp-nom-${item.id}`}
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`edit-esp-mon-${item.id}`} className="block text-xs text-slate-300 mb-1">
                        Monto
                      </label>
                      <input
                        id={`edit-esp-mon-${item.id}`}
                        type="number"
                        min="0"
                        value={editForm.monto_real}
                        onChange={(e) => setEditForm((f) => ({ ...f, monto_real: e.target.value }))}
                        className="input-field tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`edit-esp-amb-${item.id}`} className="block text-xs text-slate-300 mb-1">
                        Ámbito
                      </label>
                      <select
                        id={`edit-esp-amb-${item.id}`}
                        value={editForm.ambito}
                        onChange={(e) => setEditForm((f) => ({ ...f, ambito: e.target.value }))}
                        className="input-field"
                      >
                        <option value="personal">Personal</option>
                        <option value="kiosco_extra">Kiosco Extra</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`edit-esp-not-${item.id}`} className="block text-xs text-slate-300 mb-1">
                        Notas
                      </label>
                      <input
                        id={`edit-esp-not-${item.id}`}
                        type="text"
                        value={editForm.notas}
                        onChange={(e) => setEditForm((f) => ({ ...f, notas: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-1.5">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => saveEdit(item)}
                        className="btn-primary flex-1 px-3"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancelar"
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
    </div>
  )
}

export default GastosEspecificosSection
