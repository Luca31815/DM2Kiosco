import React, { useMemo, Suspense, lazy } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Wallet,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  formatARS,
  formatPercent,
  formatDateAR,
  formatPeriodoShort,
  diffDaysFromToday,
  toNumber,
} from '../../utils/formatters'
import { SectionHeader, StatusBadge, AmbitoBadge, ProgressBar, EmptyState } from '../ui/Primitives'
import ObjetivosSectionCard from './ObjetivosSectionCard'

const FinanzasHistoryChart = lazy(() => import('./FinanzasHistoryChart'))

const ResumenEjecutivoSection = ({
  resumen,
  periodoYm,
  onSaveObjetivos,
  onGenerarMes,
  onNavigate,
  busyAction,
}) => {
  const { totales_balance, proximos_vencimientos, historico_6m, logistica, deudas, gastos, ingresos } =
    resumen

  const coberturaPct = toNumber(totales_balance.cobertura_pct, 0)
  const balanceProy = toNumber(totales_balance.balance_proyectado, 0)
  const isSuperavit = balanceProy >= 0

  const chartData = useMemo(
    () =>
      (historico_6m || []).map((row) => ({
        label: formatPeriodoShort(row.periodo_ym || row.mes || ''),
        ingresos: toNumber(row.ingresos_totales ?? row.ingresos, 0),
        obligaciones: toNumber(row.obligaciones_totales ?? row.gastos_totales ?? row.obligaciones, 0),
        balance: toNumber(
          row.balance_proyectado ??
            row.balance ??
            toNumber(row.ingresos_totales ?? row.ingresos, 0) -
              toNumber(row.obligaciones_totales ?? row.gastos_totales ?? row.obligaciones, 0),
          0
        ),
      })),
    [historico_6m]
  )

  const hasEmptyMonth =
    ingresos.items.length === 0 &&
    gastos.items.length === 0 &&
    (ingresos.plantillas.length > 0 || gastos.plantillas.length > 0)

  return (
    <div className="space-y-6">
      <SectionHeader
        title="¿Llegamos este mes?"
        subtitle="Panorama consolidado de ingresos proyectados, obligaciones fijas y variables, logística de proveedores y cuotas de deudas."
        actions={
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
            <span>Sincronizar plantillas del mes</span>
          </button>
        }
      />

      {hasEmptyMonth && (
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-blue-100">
            <strong className="font-semibold">Mes sin instancias generadas todavía.</strong> Tenés
            plantillas activas listas para cargar en <span className="font-mono">{periodoYm}</span>.
          </div>
          <button
            type="button"
            onClick={onGenerarMes}
            disabled={busyAction === 'generar'}
            className="btn-primary shrink-0"
          >
            Generar {periodoYm} ahora
          </button>
        </div>
      )}

      {/* Cobertura Hero Strip */}
      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isSuperavit
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {isSuperavit ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-50">
                  Cobertura mensual: {formatPercent(coberturaPct)}
                </h3>
                <StatusBadge
                  variant={
                    coberturaPct >= 100 ? 'positive' : coberturaPct >= 80 ? 'warning' : 'danger'
                  }
                >
                  {isSuperavit ? 'Superávit proyectado' : 'Déficit proyectado'}
                </StatusBadge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isSuperavit
                  ? `Tus ingresos totales cubren el 100% de obligaciones con un margen de ${formatARS(balanceProy)}.`
                  : `Faltan ${formatARS(Math.abs(balanceProy))} para cubrir la totalidad de obligaciones del mes.`}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-slate-400">Balance proyectado</p>
            <p
              className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${
                isSuperavit ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isSuperavit ? '+' : ''}
              {formatARS(balanceProy)}
            </p>
          </div>
        </div>

        <ProgressBar value={coberturaPct} tone="auto" heightClass="h-3" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/70 text-xs">
          <div>
            <span className="text-slate-400 block">Gastos fijos + variables</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {formatARS(gastos.total_recurrentes + gastos.total_especificos)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Logística (1×día)</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {formatARS(logistica.total_mes)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Cuotas de deudas</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {formatARS(deudas.total_cuotas_mes)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Saldo total pasivos</span>
            <span className="font-semibold text-amber-300 tabular-nums">
              {formatARS(deudas.saldo_total_pendiente)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Ingresos Totales</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-50 tabular-nums">
            {formatARS(totales_balance.ingresos_totales)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
            Externos cobrados: {formatARS(ingresos.total_cobrado)} / {formatARS(ingresos.total_esperado)}
          </p>
          {ingresos.total_esperado > ingresos.total_cobrado && (
            <button
              type="button"
              onClick={() => onNavigate('ingresos')}
              className="mt-2 inline-flex items-center gap-1 min-h-[36px] text-xs font-semibold text-emerald-300 hover:text-emerald-200 cursor-pointer transition-colors"
            >
              <span>Tildar sueldos cobrados</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Obligaciones a Llegar</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-50 tabular-nums">
            {formatARS(totales_balance.obligaciones_totales)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
            Recurrentes: {formatARS(gastos.total_recurrentes)} · Espec.: {formatARS(gastos.total_especificos)}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Pagado vs Faltante</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <p className="font-display text-2xl font-bold text-emerald-300 tabular-nums">
            {formatARS(totales_balance.pagado_actual)}
          </p>
          <p className="text-xs text-amber-300 mt-1.5 font-medium tabular-nums">
            Falta pagar: {formatARS(totales_balance.faltante_por_pagar)}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Balance Proyectado</span>
            {isSuperavit ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <p
            className={`font-display text-2xl font-bold tabular-nums ${
              isSuperavit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSuperavit ? '+' : ''}
            {formatARS(balanceProy)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            Ingresos totales menos obligaciones
          </p>
        </div>
      </div>

      {/* Objetivos y Metas Múltiples por Tipo */}
      <ObjetivosSectionCard
        resumen={resumen}
        periodoYm={periodoYm}
        onSaveObjetivos={onSaveObjetivos}
      />

      {/* Chart 6 months + Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="glass-card rounded-3xl p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4">
            <h3 className="font-display text-base sm:text-lg font-bold text-slate-50">
              Comparativo últimos 6 meses
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evolución de ingresos totales vs obligaciones y balance neto
            </p>
          </div>

          {chartData.length > 0 ? (
            <Suspense fallback={<div className="skeleton h-[280px] w-full" />}>
              <FinanzasHistoryChart chartData={chartData} />
            </Suspense>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="Sin histórico suficiente"
              description="A medida que registres meses y gastos, verás acá la curva comparativa de los últimos 6 períodos."
            />
          )}
        </div>

        <div className="glass-card rounded-3xl p-5 sm:p-6 lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-50">
                Próximos vencimientos
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Obligaciones pendientes ordenadas por fecha
              </p>
            </div>
            <CalendarClock className="h-5 w-5 text-amber-400 shrink-0" />
          </div>

          {proximos_vencimientos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={CheckCircle2}
                title="Todo al día"
                description="No hay vencimientos pendientes cargados para este mes."
              />
            </div>
          ) : (
            <ul className="space-y-2.5 flex-1">
              {proximos_vencimientos.slice(0, 7).map((item, idx) => {
                const fecha = item.fecha_vencimiento || item.fecha
                const diff = diffDaysFromToday(fecha)
                let dueVariant = 'neutral'
                let dueLabel = formatDateAR(fecha)
                if (diff !== null) {
                  if (diff < 0) {
                    dueVariant = 'danger'
                    dueLabel = `Venció hace ${Math.abs(diff)}d`
                  } else if (diff === 0) {
                    dueVariant = 'danger'
                    dueLabel = 'Vence hoy'
                  } else if (diff <= 5) {
                    dueVariant = 'warning'
                    dueLabel = `En ${diff} días`
                  } else {
                    dueVariant = 'neutral'
                    dueLabel = formatDateAR(fecha)
                  }
                }
                const targetTab =
                  item.origen === 'deuda' || item.tipo === 'deuda'
                    ? 'deudas'
                    : item.tipo === 'especifico'
                      ? 'especificos'
                      : 'recurrentes'

                return (
                  <li
                    key={`${item.id || item.nombre}-${idx}`}
                    className="p-3 rounded-2xl bg-slate-950/65 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {item.nombre || item.concepto || item.acreedor}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <StatusBadge variant={dueVariant}>{dueLabel}</StatusBadge>
                        {item.ambito && <AmbitoBadge ambito={item.ambito} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-display font-bold text-sm text-slate-100 tabular-nums">
                        {formatARS(item.monto ?? item.monto_esperado ?? item.monto_cuota)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(targetTab)}
                        aria-label={`Ir a ${item.nombre || 'vencimiento'}`}
                        className="touch-target inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ResumenEjecutivoSection)
