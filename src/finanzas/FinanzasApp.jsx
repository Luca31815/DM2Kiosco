import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LazyMotion, domAnimation, AnimatePresence, m } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthGate from './components/AuthGate'
import LayoutHeader from './components/LayoutHeader'
import NavigationBar from './components/NavigationBar'
import { DashboardSkeleton } from './components/ui/Primitives'
import ResumenEjecutivoSection from './components/sections/ResumenEjecutivoSection'
import GastosRecurrentesSection from './components/sections/GastosRecurrentesSection'
import GastosEspecificosSection from './components/sections/GastosEspecificosSection'
import IngresosSection from './components/sections/IngresosSection'
import LogisticaSection from './components/sections/LogisticaSection'
import DeudasSection from './components/sections/DeudasSection'
import { finanzasApi, normalizeResumenMensual } from './services/finanzasApi'
import { getCurrentPeriodoYM } from './utils/formatters'
import './finanzas.css'

const STORAGE_PERIODO_KEY = 'dm2_finanzas_periodo_ym'

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

  const [resumen, setResumen] = useState(() => normalizeResumenMensual(null, getInitialPeriodoYM()))
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleChangePeriodo = useCallback((nextYm) => {
    setPeriodoYm(nextYm)
    try {
      window.localStorage.setItem(STORAGE_PERIODO_KEY, nextYm)
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const loadResumen = useCallback(async (ym, { silent = false } = {}) => {
    if (!silent) setRefreshing(true)
    setErrorMsg(null)
    try {
      const data = await finanzasApi.fetchResumenMensual(ym)
      setResumen(data)
    } catch (err) {
      console.error('[DM2 Finanzas] Error cargando resumen mensual:', err)
      setErrorMsg(err?.message || 'No se pudo cargar el resumen financiero del mes.')
      toast.error(err?.message || 'Error al cargar datos financieros')
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setRefreshing(true)
      setErrorMsg(null)
      try {
        const data = await finanzasApi.fetchResumenMensual(periodoYm)
        if (!cancelled) setResumen(data)
      } catch (err) {
        if (!cancelled) {
          console.error('[DM2 Finanzas] Error cargando resumen:', err)
          setErrorMsg(err?.message || 'No se pudo cargar el resumen financiero del mes.')
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
          setRefreshing(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [periodoYm])

  useEffect(() => {
    let cancelled = false
    finanzasApi
      .fetchProveedoresCatalogo()
      .then((list) => {
        if (!cancelled) setProveedoresCatalogo(list)
      })
      .catch((err) => {
        console.warn('[DM2 Finanzas] No se pudo cargar el catálogo de proveedores:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      await loadResumen(periodoYm, { silent: true })
    } catch (err) {
      toast.error(err?.message || 'Error al sincronizar el mes')
    } finally {
      setBusyAction(null)
    }
  }, [periodoYm, loadResumen])

  const handleSaveConfig = useCallback(
    async (sueldoObj, notas) => {
      try {
        await finanzasApi.upsertMesConfig(periodoYm, sueldoObj, notas)
        toast.success('Meta de sueldo kiosco actualizada')
        await loadResumen(periodoYm, { silent: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando la configuración del mes')
        throw err
      }
    },
    [periodoYm, loadResumen]
  )

  const handleCrudGasto = useCallback(
    async (accion, payload) => {
      try {
        await finanzasApi.crudGasto(accion, payload)
        toast.success('Gasto actualizado')
        await loadResumen(periodoYm, { silent: true })
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
        await finanzasApi.crudIngreso(accion, payload)
        toast.success('Ingreso actualizado')
        await loadResumen(periodoYm, { silent: true })
      } catch (err) {
        toast.error(err?.message || 'Error guardando el ingreso')
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
        await loadResumen(periodoYm, { silent: true })
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
        setResumen((prev) => ({
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
        }))
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
        await loadResumen(periodoYm, { silent: true })
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
    const recPend = gastosItems.filter((g) => g.es_recurrente && g.estado_pago !== 'pagado').length
    const espCount = gastosItems.filter((g) => !g.es_recurrente).length
    const ingPend = (resumen.ingresos.items || []).filter((i) => !i.cobrado).length
    const logDias = (resumen.logistica.dias_mes || []).length
    const deudasAct = (resumen.deudas.items || []).filter((d) => d.estado === 'activa').length
    return {
      recurrentes: recPend,
      especificos: espCount,
      ingresos: ingPend,
      logistica: logDias,
      deudas: deudasAct,
    }
  }, [resumen])

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-subtle text-slate-100 flex flex-col">
      <LayoutHeader
        periodoYm={periodoYm}
        onChangePeriodo={handleChangePeriodo}
        onRefresh={() => loadResumen(periodoYm)}
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
                onClick={() => loadResumen(periodoYm)}
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
            <AnimatePresence mode="wait">
              <m.div
                key={`${activeSection}-${periodoYm}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                {activeSection === 'resumen' && (
                  <ResumenEjecutivoSection
                    resumen={resumen}
                    periodoYm={periodoYm}
                    onSaveConfig={handleSaveConfig}
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
              </m.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  )
}

function FinanzasApp() {
  return (
    <div className="finanzas-root min-h-screen bg-slate-950 text-slate-100">
      <LazyMotion features={domAnimation}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3200,
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '14px',
              fontSize: '13px',
            },
          }}
        />
        <AuthGate>
          <FinanzasDashboardShell />
        </AuthGate>
      </LazyMotion>
    </div>
  )
}

export default FinanzasApp
