import React, { useState, useMemo } from 'react'
import {
  Banknote,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
  Loader2,
  Briefcase,
  Divide,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatARS, formatDateAR, getTodayISOAR, toNumber } from '../../utils/formatters'
import {
  createDefaultSplitTramos,
  distributeTotalAcrossTramos,
  validateSplitTramos,
  buildPlantillaSplitPayloads,
  buildPuntualSplitPayloads,
} from '../../utils/ingresoSplit'
import { SectionHeader, StatusBadge, ProgressBar, EmptyState } from '../ui/Primitives'
import IngresoSplitFields from './IngresoSplitFields'

const TIPO_LABELS = {
  sueldo_externo: 'Sueldo externo',
  extra: 'Ingreso extra',
  otro: 'Otro',
}

const EMPTY_PLANTILLA = {
  id: null,
  nombre: '',
  tipo: 'sueldo_externo',
  fuente: '',
  monto_base: '',
  dia_cobro: '5',
  activo: true,
}

const createEmptyPuntual = () => ({
  nombre: '',
  tipo: 'extra',
  fuente: '',
  monto_esperado: '',
  cobrado: true,
  fecha_cobro: getTodayISOAR(),
  notas: '',
})

const IngresosSection = ({
  resumen,
  periodoYm,
  onGenerarMes,
  onCrudIngreso,
  onCrudIngresoBatch,
  busyAction,
}) => {
  const [subTab, setSubTab] = useState('mes') // 'mes' | 'plantillas'

  // Puntual add form
  const [showPuntualForm, setShowPuntualForm] = useState(false)
  const [puntualForm, setPuntualForm] = useState(createEmptyPuntual)
  const [puntualDividido, setPuntualDividido] = useState(false)
  const [puntualAutoDist, setPuntualAutoDist] = useState(true)
  const [puntualTramos, setPuntualTramos] = useState(() =>
    createDefaultSplitTramos({ count: 2, mode: 'puntual', periodoYm })
  )

  // Inline edit mensual
  const [editingId, setEditingId] = useState(null)
  const [editMontoReal, setEditMontoReal] = useState('')
  const [editMontoEsperado, setEditMontoEsperado] = useState('')
  const [editFechaCobro, setEditFechaCobro] = useState('')
  const [editNotas, setEditNotas] = useState('')

  // Plantilla form
  const [showPlantillaForm, setShowPlantillaForm] = useState(false)
  const [plantillaForm, setPlantillaForm] = useState(EMPTY_PLANTILLA)
  const [plantillaDividida, setPlantillaDividida] = useState(false)
  const [plantillaAutoDist, setPlantillaAutoDist] = useState(true)
  const [plantillaSyncMes, setPlantillaSyncMes] = useState(true)
  const [plantillaTramos, setPlantillaTramos] = useState(() =>
    createDefaultSplitTramos({ count: 2, mode: 'plantilla', periodoYm })
  )

  const [saving, setSaving] = useState(false)

  const items = resumen.ingresos.items || []
  const plantillas = resumen.ingresos.plantillas || []

  const stats = useMemo(() => {
    const esperado = toNumber(resumen.ingresos.total_esperado, 0)
    const cobrado = toNumber(resumen.ingresos.total_cobrado, 0)
    const pendiente = Math.max(0, esperado - cobrado)
    const pct = esperado > 0 ? (cobrado / esperado) * 100 : 0
    return { esperado, cobrado, pendiente, pct }
  }, [resumen.ingresos])

  const handleToggleCobrado = async (item) => {
    await onCrudIngreso('toggle_cobrado', {
      id: item.id,
      cobrado: !item.cobrado,
    })
  }

  const startInlineEdit = (item) => {
    setEditingId(item.id)
    setEditMontoEsperado(String(toNumber(item.monto_esperado, 0)))
    setEditMontoReal(String(toNumber(item.monto_real ?? item.monto_esperado, 0)))
    setEditFechaCobro(item.fecha_cobro ? String(item.fecha_cobro).slice(0, 10) : '')
    setEditNotas(item.notas || '')
  }

  const saveInlineEdit = async (item) => {
    const espNum = toNumber(editMontoEsperado, -1)
    const realNum = toNumber(editMontoReal, -1)
    if (espNum < 0 || realNum < 0) {
      toast.error('Ingresá montos válidos.')
      return
    }
    setSaving(true)
    try {
      await onCrudIngreso('upsert_mensual', {
        id: item.id,
        periodo_ym: periodoYm,
        plantilla_id: item.plantilla_id ?? null,
        nombre: item.nombre,
        tipo: item.tipo || 'sueldo_externo',
        fuente: item.fuente || null,
        monto_esperado: espNum,
        monto_real: realNum,
        cobrado: Boolean(item.cobrado),
        fecha_cobro: editFechaCobro || null,
        notas: editNotas.trim() || null,
      })
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const togglePuntualModo = (isDividido) => {
    setPuntualDividido(isDividido)
    if (isDividido) {
      setPuntualAutoDist(true)
      setPuntualTramos(
        createDefaultSplitTramos({
          total: toNumber(puntualForm.monto_esperado, 0),
          count: 2,
          mode: 'puntual',
          periodoYm,
        })
      )
    }
  }

  const handlePuntualMontoChange = (val) => {
    setPuntualForm((p) => ({ ...p, monto_esperado: val }))
    if (puntualDividido && puntualAutoDist) {
      const total = Math.max(0, toNumber(val, 0))
      const amounts = distributeTotalAcrossTramos(total, puntualTramos.length)
      setPuntualTramos((prev) =>
        prev.map((t, idx) => ({ ...t, monto: total > 0 ? String(amounts[idx]) : '' }))
      )
    }
  }

  const handleAddPuntual = async (e) => {
    e.preventDefault()
    if (!puntualForm.nombre.trim()) {
      toast.error('Escribí el nombre del ingreso.')
      return
    }

    if (puntualDividido) {
      const check = validateSplitTramos(puntualTramos, 'puntual')
      if (!check.valid) {
        toast.error(check.error)
        return
      }
      const payloads = buildPuntualSplitPayloads(puntualForm, puntualTramos, periodoYm)
      setSaving(true)
      try {
        if (typeof onCrudIngresoBatch === 'function') {
          await onCrudIngresoBatch(payloads, {
            accion: 'upsert_mensual',
            syncMes: false,
            successMsg: `${payloads.length} cobros registrados en ${periodoYm}`,
          })
        } else {
          for (let i = 0; i < payloads.length; i += 1) {
            await onCrudIngreso('upsert_mensual', payloads[i])
          }
        }
        setPuntualForm(createEmptyPuntual)
        setPuntualDividido(false)
        setShowPuntualForm(false)
      } finally {
        setSaving(false)
      }
      return
    }

    const montoNum = toNumber(puntualForm.monto_esperado, -1)
    if (montoNum <= 0) {
      toast.error('Ingresá un monto mayor a 0.')
      return
    }
    setSaving(true)
    try {
      await onCrudIngreso('upsert_mensual', {
        periodo_ym: periodoYm,
        plantilla_id: null,
        nombre: puntualForm.nombre.trim(),
        tipo: puntualForm.tipo,
        fuente: puntualForm.fuente.trim() || null,
        monto_esperado: montoNum,
        monto_real: montoNum,
        cobrado: Boolean(puntualForm.cobrado),
        fecha_cobro: puntualForm.cobrado ? puntualForm.fecha_cobro || getTodayISOAR() : null,
        notas: puntualForm.notas.trim() || null,
      })
      setPuntualForm(createEmptyPuntual)
      setShowPuntualForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMensual = async (item) => {
    if (!window.confirm(`¿Eliminar el ingreso "${item.nombre}" de ${periodoYm}?`)) return
    await onCrudIngreso('delete_mensual', { id: item.id })
  }

  const openNewPlantilla = () => {
    setPlantillaForm(EMPTY_PLANTILLA)
    setPlantillaDividida(false)
    setPlantillaAutoDist(true)
    setPlantillaSyncMes(true)
    setShowPlantillaForm(true)
    setSubTab('plantillas')
  }

  const openNewSplitPlantilla = () => {
    setPlantillaForm({ ...EMPTY_PLANTILLA, tipo: 'sueldo_externo' })
    setPlantillaDividida(true)
    setPlantillaAutoDist(true)
    setPlantillaSyncMes(true)
    setPlantillaTramos(createDefaultSplitTramos({ count: 2, mode: 'plantilla', periodoYm }))
    setShowPlantillaForm(true)
    setSubTab('plantillas')
  }

  const openEditPlantilla = (pl) => {
    setPlantillaForm({
      id: pl.id,
      nombre: pl.nombre || '',
      tipo: pl.tipo || 'sueldo_externo',
      fuente: pl.fuente || '',
      monto_base: String(toNumber(pl.monto_base, 0)),
      dia_cobro: String(pl.dia_cobro ?? 5),
      activo: pl.activo !== false,
    })
    setPlantillaDividida(false)
    setShowPlantillaForm(true)
    setSubTab('plantillas')
  }

  const togglePlantillaModo = (isDividido) => {
    setPlantillaDividida(isDividido)
    if (isDividido) {
      setPlantillaAutoDist(true)
      setPlantillaTramos(
        createDefaultSplitTramos({
          total: toNumber(plantillaForm.monto_base, 0),
          count: 2,
          mode: 'plantilla',
          periodoYm,
        })
      )
    }
  }

  const handlePlantillaMontoChange = (val) => {
    setPlantillaForm((p) => ({ ...p, monto_base: val }))
    if (plantillaDividida && plantillaAutoDist) {
      const total = Math.max(0, toNumber(val, 0))
      const amounts = distributeTotalAcrossTramos(total, plantillaTramos.length)
      setPlantillaTramos((prev) =>
        prev.map((t, idx) => ({ ...t, monto: total > 0 ? String(amounts[idx]) : '' }))
      )
    }
  }

  const handleSavePlantilla = async (e) => {
    e.preventDefault()
    if (!plantillaForm.nombre.trim()) {
      toast.error('Ingresá el nombre de la plantilla.')
      return
    }

    if (!plantillaForm.id && plantillaDividida) {
      const check = validateSplitTramos(plantillaTramos, 'plantilla')
      if (!check.valid) {
        toast.error(check.error)
        return
      }
      const payloads = buildPlantillaSplitPayloads(plantillaForm, plantillaTramos)
      setSaving(true)
      try {
        if (typeof onCrudIngresoBatch === 'function') {
          await onCrudIngresoBatch(payloads, {
            accion: 'upsert_plantilla',
            syncMes: plantillaSyncMes,
            successMsg: plantillaSyncMes
              ? `${payloads.length} tramos creados y sincronizados en ${periodoYm}`
              : `${payloads.length} tramos de plantilla creados`,
          })
        } else {
          for (let i = 0; i < payloads.length; i += 1) {
            await onCrudIngreso('upsert_plantilla', payloads[i])
          }
          if (plantillaSyncMes && typeof onGenerarMes === 'function') {
            await onGenerarMes()
          }
        }
        setShowPlantillaForm(false)
        setPlantillaForm(EMPTY_PLANTILLA)
        setPlantillaDividida(false)
      } finally {
        setSaving(false)
      }
      return
    }

    const monto = toNumber(plantillaForm.monto_base, -1)
    if (monto < 0) {
      toast.error('Ingresá un monto base válido.')
      return
    }
    const dia = Math.min(31, Math.max(1, parseInt(plantillaForm.dia_cobro, 10) || 1))
    setSaving(true)
    try {
      await onCrudIngreso('upsert_plantilla', {
        ...(plantillaForm.id ? { id: plantillaForm.id } : {}),
        nombre: plantillaForm.nombre.trim(),
        tipo: plantillaForm.tipo,
        fuente: plantillaForm.fuente.trim() || null,
        monto_base: monto,
        dia_cobro: dia,
        activo: Boolean(plantillaForm.activo),
      })
      setShowPlantillaForm(false)
      setPlantillaForm(EMPTY_PLANTILLA)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlantilla = async (pl) => {
    if (!window.confirm(`¿Eliminar la plantilla de ingreso "${pl.nombre}"?`)) return
    await onCrudIngreso('delete_plantilla', { id: pl.id })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sueldos e Ingresos Externos"
        subtitle="Registrá sueldos fijos, trabajos freelance o ingresos puntuales aparte del kiosco."
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
              <span>Sincronizar mes</span>
            </button>
            <button
              type="button"
              onClick={openNewSplitPlantilla}
              className="btn-secondary"
            >
              <Divide className="h-4 w-4 text-emerald-400" />
              <span>Sueldo dividido</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('mes')
                setShowPuntualForm((v) => !v)
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Ingreso puntual</span>
            </button>
          </>
        }
      />

      {/* Summary Strip */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-xs text-slate-400">Esperado externos</span>
            <p className="font-display text-lg font-bold text-slate-50 tabular-nums mt-0.5">
              {formatARS(stats.esperado)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Ya cobrado</span>
            <p className="font-display text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
              {formatARS(stats.cobrado)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Pendiente de cobro</span>
            <p className="font-display text-lg font-bold text-amber-300 tabular-nums mt-0.5">
              {formatARS(stats.pendiente)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Aporte Kiosco (ganancia)</span>
            <p className="font-display text-lg font-bold text-blue-300 tabular-nums mt-0.5">
              {formatARS(resumen.kiosco_mes.ganancia_estimada_mes)}
            </p>
          </div>
        </div>
        <ProgressBar value={stats.pct} tone="positive" heightClass="h-2" />
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('mes')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              subTab === 'mes'
                ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Ingresos {periodoYm} ({items.length})
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
            Plantillas recurrentes ({plantillas.length})
          </button>
        </div>

        {subTab === 'plantillas' && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={openNewSplitPlantilla} className="btn-secondary">
              <Divide className="h-4 w-4 text-emerald-400" />
              <span>Sueldo dividido</span>
            </button>
            <button type="button" onClick={openNewPlantilla} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Nueva plantilla</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-view 1: Ingresos del Mes */}
      {subTab === 'mes' && (
        <div className="space-y-4">
          {showPuntualForm && (
            <form
              onSubmit={handleAddPuntual}
              className="glass-card rounded-3xl p-5 border-emerald-500/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-100">
                  Nuevo ingreso puntual en {periodoYm}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPuntualForm(false)}
                  aria-label="Cerrar formulario"
                  className="btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="ing-nombre" className="block text-xs font-semibold text-slate-300 mb-1">
                    Descripción
                  </label>
                  <input
                    id="ing-nombre"
                    type="text"
                    required
                    value={puntualForm.nombre}
                    onChange={(e) => setPuntualForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Sueldo, Venta usada, Bono"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="ing-tipo" className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    id="ing-tipo"
                    value={puntualForm.tipo}
                    onChange={(e) => setPuntualForm((p) => ({ ...p, tipo: e.target.value }))}
                    className="input-field"
                  >
                    <option value="sueldo_externo">Sueldo externo</option>
                    <option value="extra">Ingreso extra</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ing-fuente" className="block text-xs font-semibold text-slate-300 mb-1">
                    Fuente / Empleador
                  </label>
                  <input
                    id="ing-fuente"
                    type="text"
                    value={puntualForm.fuente}
                    onChange={(e) => setPuntualForm((p) => ({ ...p, fuente: e.target.value }))}
                    placeholder="Ej: Empresa, Cliente"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="ing-monto" className="block text-xs font-semibold text-slate-300 mb-1">
                    {puntualDividido ? 'Monto total (ARS)' : 'Monto (ARS)'}
                  </label>
                  <input
                    id="ing-monto"
                    type="number"
                    min="1"
                    step="100"
                    required={!puntualDividido}
                    value={puntualForm.monto_esperado}
                    onChange={(e) => handlePuntualMontoChange(e.target.value)}
                    placeholder="450000"
                    className="input-field tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => togglePuntualModo(false)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      !puntualDividido
                        ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    1 cobro único
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePuntualModo(true)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      puntualDividido
                        ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    <Divide className="h-3.5 w-3.5" />
                    <span>Dividir en varios cobros (ej. al medio)</span>
                  </button>
                </div>
              </div>

              {puntualDividido && (
                <IngresoSplitFields
                  mode="puntual"
                  idPrefix="puntual-split"
                  totalMonto={puntualForm.monto_esperado}
                  tramos={puntualTramos}
                  onChangeTramos={(next, nextAuto) => {
                    setPuntualTramos(next)
                    if (typeof nextAuto === 'boolean') setPuntualAutoDist(nextAuto)
                  }}
                  onSyncTotalFromTramos={(sumVal) => {
                    setPuntualForm((p) => ({ ...p, monto_esperado: String(sumVal) }))
                  }}
                  periodoYm={periodoYm}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {!puntualDividido && (
                  <div className="sm:col-span-3">
                    <label htmlFor="ing-fecha" className="block text-xs font-semibold text-slate-300 mb-1">
                      Fecha de cobro
                    </label>
                    <input
                      id="ing-fecha"
                      type="date"
                      value={puntualForm.fecha_cobro}
                      onChange={(e) => setPuntualForm((p) => ({ ...p, fecha_cobro: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                )}
                <div className={puntualDividido ? 'sm:col-span-8' : 'sm:col-span-5'}>
                  <label htmlFor="ing-notas" className="block text-xs font-semibold text-slate-300 mb-1">
                    Notas (opcional)
                  </label>
                  <input
                    id="ing-notas"
                    type="text"
                    value={puntualForm.notas}
                    onChange={(e) => setPuntualForm((p) => ({ ...p, notas: e.target.value }))}
                    placeholder="Ej: Transferencia bancaria"
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-4 flex flex-wrap items-center justify-end gap-2">
                  {!puntualDividido && (
                    <label
                      htmlFor="ing-puntual-cobrado"
                      className="inline-flex items-center gap-2 min-h-[44px] text-xs text-slate-200 mr-auto cursor-pointer"
                    >
                      <input
                        id="ing-puntual-cobrado"
                        type="checkbox"
                        checked={puntualForm.cobrado}
                        onChange={(e) => setPuntualForm((p) => ({ ...p, cobrado: e.target.checked }))}
                        className="h-4 w-4 accent-emerald-500 rounded"
                      />
                      <span>Ya cobrado</span>
                    </label>
                  )}
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>{puntualDividido ? `Guardar ${puntualTramos.length} cobros` : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="Sin ingresos externos cargados este mes"
              description="Podés cargar un ingreso puntual arriba o configurar tus sueldos recurrentes en la pestaña de Plantillas."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={openNewSplitPlantilla} className="btn-primary">
                    <Divide className="h-4 w-4" />
                    <span>Cargar sueldo dividido</span>
                  </button>
                  <button type="button" onClick={openNewPlantilla} className="btn-secondary">
                    <Plus className="h-4 w-4" />
                    <span>Crear plantilla de sueldo</span>
                  </button>
                </div>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => {
                const isCobrado = Boolean(item.cobrado)
                const isEditing = editingId === item.id
                const montoMostrar = toNumber(item.monto_real ?? item.monto_esperado, 0)

                return (
                  <div key={item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCobrado(item)}
                          aria-label={isCobrado ? 'Marcar pendiente de cobro' : 'Marcar cobrado'}
                          className={`touch-target inline-flex items-center justify-center rounded-xl border cursor-pointer shrink-0 transition-colors ${
                            isCobrado
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500'
                          }`}
                        >
                          {isCobrado ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm sm:text-base font-semibold text-slate-100">
                              {item.nombre}
                            </p>
                            <StatusBadge variant={isCobrado ? 'positive' : 'warning'}>
                              {isCobrado ? 'Cobrado' : 'Pendiente'}
                            </StatusBadge>
                            <StatusBadge variant="info">
                              {TIPO_LABELS[item.tipo] || item.tipo || 'Ingreso'}
                            </StatusBadge>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {item.fuente ? `${item.fuente} · ` : ''}
                            {item.fecha_cobro ? `Cobro: ${formatDateAR(item.fecha_cobro)}` : 'Sin fecha de cobro'}
                            {item.notas ? ` · ${item.notas}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pl-[56px] sm:pl-0">
                        <div className="text-left sm:text-right mr-1">
                          <p className="font-display text-base sm:text-lg font-bold text-emerald-300 tabular-nums">
                            {formatARS(montoMostrar)}
                          </p>
                          {item.monto_real !== null &&
                            item.monto_real !== undefined &&
                            toNumber(item.monto_real) !== toNumber(item.monto_esperado) && (
                              <p className="text-[11px] text-slate-400 tabular-nums">
                                Esperado: {formatARS(item.monto_esperado)}
                              </p>
                            )}
                        </div>
                        <button
                          type="button"
                          onClick={() => (isEditing ? setEditingId(null) : startInlineEdit(item))}
                          aria-label={`Editar ${item.nombre}`}
                          className="btn-ghost border border-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMensual(item)}
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
                          <label htmlFor={`edit-ing-real-${item.id}`} className="block text-xs text-slate-300 mb-1">
                            Monto real cobrado
                          </label>
                          <input
                            id={`edit-ing-real-${item.id}`}
                            type="number"
                            min="0"
                            value={editMontoReal}
                            onChange={(e) => setEditMontoReal(e.target.value)}
                            className="input-field tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor={`edit-ing-esp-${item.id}`} className="block text-xs text-slate-300 mb-1">
                            Monto esperado
                          </label>
                          <input
                            id={`edit-ing-esp-${item.id}`}
                            type="number"
                            min="0"
                            value={editMontoEsperado}
                            onChange={(e) => setEditMontoEsperado(e.target.value)}
                            className="input-field tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label htmlFor={`edit-ing-fecha-${item.id}`} className="block text-xs text-slate-300 mb-1">
                            Fecha de cobro
                          </label>
                          <input
                            id={`edit-ing-fecha-${item.id}`}
                            type="date"
                            value={editFechaCobro}
                            onChange={(e) => setEditFechaCobro(e.target.value)}
                            className="input-field"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor={`edit-ing-not-${item.id}`} className="block text-xs text-slate-300 mb-1">
                            Notas
                          </label>
                          <input
                            id={`edit-ing-not-${item.id}`}
                            type="text"
                            value={editNotas}
                            onChange={(e) => setEditNotas(e.target.value)}
                            className="input-field"
                          />
                        </div>
                        <div className="sm:col-span-2 flex gap-1.5">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveInlineEdit(item)}
                            aria-label="Guardar edición"
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
      )}

      {/* Sub-view 2: Plantillas Recurrentes */}
      {subTab === 'plantillas' && (
        <div className="space-y-4">
          {showPlantillaForm && (
            <form
              onSubmit={handleSavePlantilla}
              className="glass-card rounded-3xl p-5 border-blue-500/35 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-100">
                  {plantillaForm.id ? 'Editar plantilla de ingreso' : 'Nueva plantilla de ingreso'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPlantillaForm(false)}
                  aria-label="Cerrar"
                  className="btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2">
                  <label htmlFor="pli-nombre" className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    id="pli-nombre"
                    type="text"
                    required
                    value={plantillaForm.nombre}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Sueldo trabajo principal"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="pli-tipo" className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    id="pli-tipo"
                    value={plantillaForm.tipo}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, tipo: e.target.value }))}
                    className="input-field"
                  >
                    <option value="sueldo_externo">Sueldo externo</option>
                    <option value="extra">Extra</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pli-fuente" className="block text-xs font-semibold text-slate-300 mb-1">
                    Fuente
                  </label>
                  <input
                    id="pli-fuente"
                    type="text"
                    value={plantillaForm.fuente}
                    onChange={(e) => setPlantillaForm((p) => ({ ...p, fuente: e.target.value }))}
                    placeholder="Ej: Empleador"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="pli-monto" className="block text-xs font-semibold text-slate-300 mb-1">
                    {!plantillaForm.id && plantillaDividida ? 'Monto total mensual (ARS)' : 'Monto base (ARS)'}
                  </label>
                  <input
                    id="pli-monto"
                    type="number"
                    min="0"
                    step="100"
                    required={Boolean(plantillaForm.id) || !plantillaDividida}
                    value={plantillaForm.monto_base}
                    onChange={(e) => handlePlantillaMontoChange(e.target.value)}
                    placeholder={!plantillaForm.id && plantillaDividida ? '800000' : '450000'}
                    className="input-field tabular-nums"
                  />
                </div>
              </div>

              {!plantillaForm.id && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => togglePlantillaModo(false)}
                      className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        !plantillaDividida
                          ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      1 pago por mes
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlantillaModo(true)}
                      className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                        plantillaDividida
                          ? 'bg-blue-600/25 text-blue-200 border border-blue-500/35'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <Divide className="h-3.5 w-3.5" />
                      <span>Dividido (al medio / varios días)</span>
                    </button>
                  </div>
                </div>
              )}

              {!plantillaForm.id && plantillaDividida && (
                <IngresoSplitFields
                  mode="plantilla"
                  idPrefix="plantilla-split"
                  totalMonto={plantillaForm.monto_base}
                  tramos={plantillaTramos}
                  onChangeTramos={(next, nextAuto) => {
                    setPlantillaTramos(next)
                    if (typeof nextAuto === 'boolean') setPlantillaAutoDist(nextAuto)
                  }}
                  onSyncTotalFromTramos={(sumVal) => {
                    setPlantillaForm((p) => ({ ...p, monto_base: String(sumVal) }))
                  }}
                  periodoYm={periodoYm}
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  {(Boolean(plantillaForm.id) || !plantillaDividida) && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="pli-dia" className="text-xs font-semibold text-slate-300">
                        Día de cobro (1–31):
                      </label>
                      <input
                        id="pli-dia"
                        type="number"
                        min="1"
                        max="31"
                        value={plantillaForm.dia_cobro}
                        onChange={(e) => setPlantillaForm((p) => ({ ...p, dia_cobro: e.target.value }))}
                        className="input-field w-20 tabular-nums"
                      />
                    </div>
                  )}
                  <label
                    htmlFor="pli-activa"
                    className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm text-slate-200"
                  >
                    <input
                      id="pli-activa"
                      type="checkbox"
                      checked={plantillaForm.activo}
                      onChange={(e) => setPlantillaForm((p) => ({ ...p, activo: e.target.checked }))}
                      className="h-4 w-4 accent-blue-500 rounded"
                    />
                    <span>Activa</span>
                  </label>
                  {!plantillaForm.id && plantillaDividida && (
                    <label
                      htmlFor="pli-sync-mes"
                      className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm text-emerald-200"
                    >
                      <input
                        id="pli-sync-mes"
                        type="checkbox"
                        checked={plantillaSyncMes}
                        onChange={(e) => setPlantillaSyncMes(e.target.checked)}
                        className="h-4 w-4 accent-emerald-500 rounded"
                      />
                      <span>Sincronizar también en {periodoYm} al guardar</span>
                    </label>
                  )}
                </div>

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
                    <span>
                      {plantillaForm.id
                        ? 'Guardar cambios'
                        : plantillaDividida
                          ? `Crear ${plantillaTramos.length} tramos`
                          : 'Crear plantilla'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {plantillas.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Sin plantillas de ingresos"
              description="Configurá tus sueldos o ingresos fijos recurrentes para que se generen automáticamente al iniciar cada mes."
              action={
                <button type="button" onClick={openNewPlantilla} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  <span>Crear plantilla</span>
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {plantillas.map((pl) => (
                <div
                  key={pl.id}
                  className={`glass-card rounded-2xl p-4 flex items-center justify-between gap-3 ${
                    pl.activo === false ? 'opacity-60' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">{pl.nombre}</p>
                      <StatusBadge variant="info">{TIPO_LABELS[pl.tipo] || pl.tipo}</StatusBadge>
                      {pl.activo === false && <StatusBadge variant="neutral">Inactiva</StatusBadge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {pl.fuente ? `${pl.fuente} · ` : ''}Cobra día {pl.dia_cobro || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-display font-bold text-sm text-emerald-300 tabular-nums mr-1">
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

export default React.memo(IngresosSection)
