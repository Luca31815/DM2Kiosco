import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react'
import { LazyMotion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthGate from './components/AuthGate'
import LayoutHeader from './components/LayoutHeader'
import NavigationBar from './components/NavigationBar'
import { DashboardSkeleton } from './components/ui/Primitives'
import ResumenEjecutivoSection from './components/sections/ResumenEjecutivoSection'
import { finanzasApi, normalizeResumenMensual } from './services/finanzasApi'
import { getCurrentPeriodoYM } from './utils/formatters'
import { computeSueldoKioscoFromObjetivos } from './utils/objetivosMeta'
import './finanzas.css'

const GastosRecurrentesSection = lazy(() => import('./components/sections/GastosRecurrentesSection'))
const GastosEspecificosSection = lazy(() => import('./components/sections/GastosEspecificosSection'))
const IngresosSection = lazy(() => import('./components/sections/IngresosSection'))
const LogisticaSection = lazy(() => import('./components/sections/LogisticaSection'))
const DeudasSection = lazy(() => import('./components/sections/DeudasSection'))

const loadDomAnimation = () => import('framer-motion').then((mod) => mod.domAnimation)

const STORAGE_PERIODO_KEY = 'dm2_finanzas_periodo_ym'

const TOAST_OPTIONS = {
  duration: 3200,
  style: {
    background: '#0f172a',
    color: '#f1f5f9',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '14px',
    fontSize: '13px',
  },
}

function getInitialPeriodoYM() {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('mes')
    if (fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)) return fromUrl
    const saved = window.localStorage.getItem(STORAGE_PERIODO_KEY)
    if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved
  } catch {
    // Ignore storage access errors
  }
  return getCurrentPeriodoYM()
}

const FinanzasDashboardShell = () => {
  const { user, signOut } = useAuth()
  const [periodoYm, setPeriodoYm] = useState(getInitialPeriodoYM)
  const [activeSection, setActiveSection] = useState('resumen')

  const [resumen, setResumen] = useState(() => normalizeResumenMensual(null, periodoYm))
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const resumenCacheRef = useRef(new Map())
  const cacheSeqRef = useRef(new Map())
  const inFlightRef = useRef(new Map())
  const requestSeqRef = useRef(0)
  const mountedRef = useRef(true)
  const proveedoresLoadedRef = useRef(false)
  const resumenRef = useRef(resumen)

  useEffect(() => {
    resumenRef.current = resumen
  }, [resumen])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleChangePeriodo = useCallback((nextYm) => {
    setPeriodoYm(nextYm)
    try {
      window.localStorage.setItem(STORAGE_PERIODO_KEY, nextYm)
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const loadResumen = useCallback(async (ym, { silent = false, force = false } = {}) => {
    const seq = ++requestSeqRef.current
    cacheSeqRef.current.set(ym, seq)

    const cached = !force ? resumenCacheRef.current.get(ym) : undefined
    if (cached) {
      setResumen(cached)
      setInitialLoading(false)
    }

    if (!silent) setRefreshing(true)
    setErrorMsg(null)

    let promise = !force ? inFlightRef.current.get(ym) : null
    if (!promise) {
      promise = finanzasApi.fetchResumenMensual(ym)
      inFlightRef.current.set(ym, promise)
    }

    try {
      const data = await promise
      if (seq >= (cacheSeqRef.current.get(ym) || 0)) {
        resumenCacheRef.current.set(ym, data)
      }
      if (!mountedRef.current || seq !== requestSeqRef.current) return
      setResumen(data)
    } catch (err) {
      if (!mountedRef.current || seq !== requestSeqRef.current) return
      console.error('[DM2 Finanzas] Error cargando resumen mensual:', err)
      setErrorMsg(err?.message || 'No se pudo cargar el resumen financiero del mes.')
      toast.error(err?.message || 'Error al cargar datos financieros')
    } finally {
      if (inFlightRef.current.get(ym) === promise) {
        inFlightRef.current.delete(ym)
      }
      if (mountedRef.current && seq === requestSeqRef.current) {
        setInitialLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    loadResumen(periodoYm)
  }, [periodoYm, loadResumen])

  useEffect(() => {
    if (activeSection !== 'logistica' || proveedoresLoadedRef.current || proveedoresCatalogo.length > 0) {
      return
    }
    let cancelled = false
    finanzasApi
      .fetchProveedoresCatalogo()
      .then((list) => {
        if (!cancelled) {
          proveedoresLoadedRef.current = true
          setProveedoresCatalogo(list)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[DM2 Finanzas] No se pudo cargar el catálogo de proveedores:', err)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeSection, proveedoresCatalogo.length])

  const handleRefresh = useCallback(
    () => loadResumen(periodoYm, { force: true }),
    [periodoYm, loadResumen]
  )

  const handleGenerarMes = useCallback(async () => {
    setBusyAction('generar')
    try {
      const genRes = await finanzasApi.generarMes(periodoYm)
      const gCreados = Number(genRes?.gastos_creados) || 0
      const iCreados = Number(genRes?.ingresos_creados) || 0
      if (gCreados > 0 || iCreados > 0) {
        toast.success(`Mes ${periodoYm} sincronizado: +${gCreados} gastos y +${iCreados} ingresos`)
      } else {
        toast.success(`Mes ${periodoYm} ya estaba al día (sin duplicados)`)
      }
      await loadResumen(periodoYm, { silent: true, force: true })
    } catch (err) {
      toast.error(err?.message || 'Error al sincronizar el mes')
    } finally {
      setBusyAction(null)
    }
  }, [periodoYm, loadResumen])

  const handleSaveObjetivos = useCallback(
    async (nextObjetivos, notas = null) => {
      try {
        const sueldoCalc = computeSueldoKioscoFromObjetivos(nextObjetivos)
        await finanzasApi.upsertObjetivos(periodoYm, nextObjetivos, sueldoCalc, notas)
        toast.success('Objetivos del mes actualizados')
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando los objetivos del mes')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleCrudGasto = useCallback(
    async (accion, payload) => {
      try {
        if (accion === 'delete_plantilla' && payload?.eliminar_pendientes && payload?.id != null) {
          const pendientes = (resumenRef.current?.gastos?.items || []).filter(
            (g) => Number(g.plantilla_id) === Number(payload.id) && g.estado_pago === 'pendiente'
          )
          for (let i = 0; i < pendientes.length; i += 1) {
            await finanzasApi.crudGasto('delete_mensual', { id: pendientes[i].id })
          }
          await finanzasApi.crudGasto('delete_plantilla', { id: payload.id })
          toast.success(
            pendientes.length > 0
              ? 'Plantilla y pendientes del mes eliminados'
              : 'Plantilla eliminada'
          )
        } else {
          await finanzasApi.crudGasto(accion, payload)
          const msgMap = {
            delete_mensual: 'Gasto eliminado del mes',
            delete_plantilla: 'Plantilla eliminada',
            toggle_estado: 'Estado de pago actualizado',
          }
          toast.success(msgMap[accion] || 'Gasto actualizado')
        }
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando el gasto')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleCrudIngreso = useCallback(
    async (accion, payload) => {
      try {
        if (accion === 'delete_plantilla' && payload?.eliminar_pendientes && payload?.id != null) {
          const pendientes = (resumenRef.current?.ingresos?.items || []).filter(
            (it) => Number(it.plantilla_id) === Number(payload.id) && !it.cobrado
          )
          for (let i = 0; i < pendientes.length; i += 1) {
            await finanzasApi.crudIngreso('delete_mensual', { id: pendientes[i].id })
          }
          await finanzasApi.crudIngreso('delete_plantilla', { id: payload.id })
          toast.success(
            pendientes.length > 0
              ? 'Plantilla y pendientes del mes eliminados'
              : 'Plantilla de ingreso eliminada'
          )
        } else {
          await finanzasApi.crudIngreso(accion, payload)
          const msgMap = {
            delete_mensual: 'Ingreso eliminado del mes',
            delete_plantilla: 'Plantilla de ingreso eliminada',
            toggle_cobrado: payload?.cobrado
              ? 'Ingreso marcado como cobrado'
              : 'Ingreso marcado como pendiente',
          }
          toast.success(msgMap[accion] || 'Ingreso actualizado')
        }
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando el ingreso')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleCrudIngresoBatch = useCallback(
    async (payloads, { accion, syncMes = false, successMsg } = {}) => {
      if (!Array.isArray(payloads) || payloads.length === 0) return
      try {
        for (let i = 0; i < payloads.length; i += 1) {
          await finanzasApi.crudIngreso(accion, payloads[i])
        }
        if (syncMes) {
          await finanzasApi.generarMes(periodoYm)
        }
        toast.success(successMsg || `${payloads.length} tramos guardados`)
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando los tramos de ingreso')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleCrudLogistica = useCallback(
    async (accion, payload) => {
      try {
        await finanzasApi.crudReglaLogistica(accion, payload)
        toast.success(
          accion === 'set_override' ? 'Override diario actualizado' : 'Regla de logística actualizada'
        )
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando logística')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleRecalcularLogistica = useCallback(async () => {
    setBusyAction('logistica')
    try {
      const logRes = await finanzasApi.fetchGastosLogisticosMes(periodoYm)
      if (logRes && typeof logRes === 'object') {
        setResumen((prev) => {
          const next = {
            ...prev,
            logistica: {
              ...prev.logistica,
              reglas: Array.isArray(logRes.reglas) ? logRes.reglas : prev.logistica.reglas,
              dias_mes: Array.isArray(logRes.dias_mes)
                ? logRes.dias_mes
                : Array.isArray(logRes.dias)
                  ? logRes.dias
                  : Array.isArray(logRes)
                    ? logRes
                    : prev.logistica.dias_mes,
              total_mes:
                logRes.total_mes !== undefined ? Number(logRes.total_mes) || 0 : prev.logistica.total_mes,
              total_dias_computados:
                logRes.total_dias_computados !== undefined
                  ? Number(logRes.total_dias_computados) || 0
                  : prev.logistica.total_dias_computados,
            },
          }
          if (!prev.periodo_ym || prev.periodo_ym === periodoYm) {
            resumenCacheRef.current.set(periodoYm, next)
          }
          return next
        })
      }
      toast.success(`Logística de ${periodoYm} recalculada`)
    } catch (err) {
      toast.error(err?.message || 'Error recalculando logística del mes')
    } finally {
      setBusyAction(null)
    }
  }, [periodoYm])

  const handleCrudDeuda = useCallback(
    async (accion, payload) => {
      try {
        await finanzasApi.crudDeuda(accion, payload)
        const msgMap = {
          registrar_pago: 'Pago registrado y descontado del saldo',
          eliminar_pago: 'Pago deshecho y saldo restaurado',
          delete: 'Deuda eliminada',
          upsert: 'Deuda guardada',
        }
        toast.success(msgMap[accion] || 'Deuda actualizada')
        await loadResumen(periodoYm, { silent: true, force: true })
      } catch (err) {
        toast.error(err?.message || 'Error procesando la deuda')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada')
    } catch (err) {
      toast.error(err?.message || 'Error cerrando sesión')
    }
  }, [signOut])

  const navBadges = useMemo(() => {
    const gastosItems = resumen.gastos.items || []
    let recPend = 0
    let espCount = 0
    for (let i = 0; i < gastosItems.length; i += 1) {
      const g = gastosItems[i]
      if (g.es_recurrente) {
        if (g.estado_pago !== 'pagado') recPend += 1
      } else {
        espCount += 1
      }
    }

    const ingresosItems = resumen.ingresos.items || []
    let ingPend = 0
    for (let i = 0; i < ingresosItems.length; i += 1) {
      if (!ingresosItems[i].cobrado) ingPend += 1
    }

    const deudasItems = resumen.deudas.items || []
    let deudasAct = 0
    for (let i = 0; i < deudasItems.length; i += 1) {
      if (deudasItems[i].estado === 'activa') deudasAct += 1
    }

    return {
      recurrentes: recPend,
      especificos: espCount,
      ingresos: ingPend,
      logistica: (resumen.logistica.dias_mes || []).length,
      deudas: deudasAct,
    }
  }, [resumen])

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-subtle text-slate-100 flex flex-col">
      <LayoutHeader
        periodoYm={periodoYm}
        onChangePeriodo={handleChangePeriodo}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />

      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-5 lg:py-7">
        <NavigationBar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          badges={navBadges}
        />

        <main className="flex-1 min-w-0 pb-12">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 text-sm"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error conectando con los RPCs de Finanzas</p>
                  <p className="text-xs text-rose-200/80 mt-0.5">{errorMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="btn-secondary shrink-0 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          )}

          {initialLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="finanzas-section-container">
              <Suspense fallback={<DashboardSkeleton />}>
                {activeSection === 'resumen' && (
                  <ResumenEjecutivoSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onSaveObjetivos={handleSaveObjetivos}
                    onGenerarMes={handleGenerarMes}
                    onNavigate={setActiveSection}
                    busyAction={busyAction}
                  />
                )}

                {activeSection === 'recurrentes' && (
                  <GastosRecurrentesSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onGenerarMes={handleGenerarMes}
                    onCrudGasto={handleCrudGasto}
                    busyAction={busyAction}
                  />
                )}

                {activeSection === 'especificos' && (
                  <GastosEspecificosSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onCrudGasto={handleCrudGasto}
                  />
                )}

                {activeSection === 'ingresos' && (
                  <IngresosSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onGenerarMes={handleGenerarMes}
                    onCrudIngreso={handleCrudIngreso}
                    onCrudIngresoBatch={handleCrudIngresoBatch}
                    busyAction={busyAction}
                  />
                )}

                {activeSection === 'logistica' && (
                  <LogisticaSection
                    resumen={resumen}
                    proveedoresCatalogo={proveedoresCatalogo}
                    periodoYm={periodoYm}
                    onCrudLogistica={handleCrudLogistica}
                    onRecalcularLogistica={handleRecalcularLogistica}
                    busyAction={busyAction}
                  />
                )}

                {activeSection === 'deudas' && (
                  <DeudasSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onCrudDeuda={handleCrudDeuda}
                  />
                )}
              </Suspense>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FinanzasApp() {
  return (
    <div className="finanzas-root min-h-screen bg-slate-950 text-slate-100">
      <LazyMotion features={loadDomAnimation}>
        <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
        <AuthGate>
          <FinanzasDashboardShell />
        </AuthGate>
      </LazyMotion>
    </div>
  )
}

export default FinanzasApp
