import React from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeftRight,
  LogOut,
  Calendar,
} from 'lucide-react'
import {
  formatPeriodoLabel,
  getCurrentPeriodoYM,
  shiftPeriodoYM,
} from '../utils/formatters'

const LayoutHeader = ({
  periodoYm,
  onChangePeriodo,
  onRefresh,
  refreshing,
  userEmail,
  onSignOut,
}) => {
  const currentYm = getCurrentPeriodoYM()
  const isCurrentMonth = periodoYm === currentYm

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-50 truncate">
              DM2 Finanzas
            </h1>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Control mensual privado · {userEmail || 'Operador'}
            </p>
          </div>
        </div>

        {/* Month Selector (persistent YYYY-MM) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-center">
          <button
            type="button"
            onClick={() => onChangePeriodo(shiftPeriodoYM(periodoYm, -1))}
            aria-label="Mes anterior"
            className="touch-target inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <label className="relative flex items-center gap-2 px-2.5 min-h-[44px] cursor-pointer">
            <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="font-display text-sm font-semibold text-slate-100 whitespace-nowrap">
              {formatPeriodoLabel(periodoYm)}
            </span>
            <input
              type="month"
              aria-label="Seleccionar período mes y año"
              value={periodoYm}
              onChange={(e) => {
                if (e.target.value) onChangePeriodo(e.target.value)
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          <button
            type="button"
            onClick={() => onChangePeriodo(shiftPeriodoYM(periodoYm, 1))}
            aria-label="Mes siguiente"
            className="touch-target inline-flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => onChangePeriodo(currentYm)}
              className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-blue-300 hover:text-white hover:bg-blue-600/20 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Actualizar datos del mes"
            title="Actualizar datos"
            className="btn-ghost border border-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden md:inline text-xs">Actualizar</span>
          </button>

          <Link
            to="/"
            className="btn-secondary text-xs sm:text-sm px-3 sm:px-3.5"
            title="Ir al dashboard de ventas del kiosco"
          >
            <ArrowLeftRight className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline sm:inline">Volver al Kiosco</span>
            <span className="sm:hidden">Kiosco</span>
          </Link>

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="btn-ghost text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800/80"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default React.memo(LayoutHeader)
