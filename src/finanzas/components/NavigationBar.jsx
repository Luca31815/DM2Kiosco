import React from 'react'
import {
  LayoutDashboard,
  Repeat,
  Receipt,
  Banknote,
  Truck,
  CreditCard,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    id: 'resumen',
    label: 'Resumen',
    fullLabel: 'Resumen Ejecutivo',
    hint: '¿Llegamos este mes?',
    icon: LayoutDashboard,
  },
  {
    id: 'recurrentes',
    label: 'Recurrentes',
    fullLabel: 'Gastos Recurrentes',
    hint: 'A los que hay que llegar',
    icon: Repeat,
  },
  {
    id: 'especificos',
    label: 'Específicos',
    fullLabel: 'Gastos Específicos',
    hint: 'Eventuales del mes',
    icon: Receipt,
  },
  {
    id: 'ingresos',
    label: 'Ingresos',
    fullLabel: 'Sueldos e Ingresos',
    hint: 'Externos y extras',
    icon: Banknote,
  },
  {
    id: 'logistica',
    label: 'Logística',
    fullLabel: 'Logística 1×día',
    hint: 'Fletes por proveedor',
    icon: Truck,
  },
  {
    id: 'deudas',
    label: 'Deudas',
    fullLabel: 'Deudas y Cuotas',
    hint: 'Pasivos activos',
    icon: CreditCard,
  },
]

const EMPTY_BADGES = {}

const NavigationBar = ({ activeSection, onSelectSection, badges = EMPTY_BADGES }) => {
  return (
    <>
      {/* Mobile / Tablet horizontal scrollable bar */}
      <nav
        aria-label="Secciones de finanzas"
        className="lg:hidden sticky top-[118px] sm:top-[69px] z-20 bg-slate-950/92 backdrop-blur-md border-b border-slate-800/80"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-4 py-2">
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            const badge = badges[item.id]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive ? 'bg-blue-500/30 text-blue-100' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop persistent left sidebar */}
      <aside
        aria-label="Navegación principal"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-[85px] self-start gap-1.5"
      >
        {NAV_SECTIONS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          const badge = badges[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 min-h-[52px] rounded-2xl text-left transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/40 text-slate-50 shadow-sm'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-900 text-slate-400 border border-slate-800/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.fullLabel}</p>
                  <p className="text-[11px] text-slate-400 truncate">{item.hint}</p>
                </div>
              </div>
              {badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-blue-500/30 text-blue-100'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </aside>
    </>
  )
}

export default React.memo(NavigationBar)
