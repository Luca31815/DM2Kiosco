import React from 'react'

export const SectionHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    <div className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-50">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
)

export const StatusBadge = ({ variant = 'neutral', children, className = '' }) => {
  const styles = {
    neutral: 'bg-slate-800/90 text-slate-300 border-slate-700/80',
    positive: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/12 text-rose-300 border-rose-500/30',
    info: 'bg-blue-500/12 text-blue-300 border-blue-500/30',
    violet: 'bg-violet-500/12 text-violet-300 border-violet-500/30',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[variant] || styles.neutral
      } ${className}`}
    >
      {children}
    </span>
  )
}

export const AmbitoBadge = ({ ambito }) => {
  if (ambito === 'kiosco_extra') {
    return <StatusBadge variant="info">Kiosco Extra</StatusBadge>
  }
  return <StatusBadge variant="violet">Personal</StatusBadge>
}

export const PrioridadBadge = ({ prioridad }) => {
  if (prioridad === 'alta') return <StatusBadge variant="danger">Alta</StatusBadge>
  if (prioridad === 'media') return <StatusBadge variant="warning">Media</StatusBadge>
  return <StatusBadge variant="neutral">Baja</StatusBadge>
}

export const ProgressBar = ({ value = 0, tone = 'auto', heightClass = 'h-2.5' }) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  let barColor = 'bg-blue-500'
  if (tone === 'auto') {
    if (clamped >= 100) barColor = 'bg-emerald-500'
    else if (clamped >= 80) barColor = 'bg-amber-400'
    else barColor = 'bg-rose-500'
  } else if (tone === 'positive') {
    barColor = 'bg-emerald-500'
  } else if (tone === 'warning') {
    barColor = 'bg-amber-400'
  } else if (tone === 'danger') {
    barColor = 'bg-rose-500'
  } else if (tone === 'info') {
    barColor = 'bg-blue-500'
  }

  return (
    <div
      className={`w-full ${heightClass} rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/50`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center">
    {Icon && (
      <div className="h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="h-5 w-5" />
      </div>
    )}
    <h3 className="font-display text-base font-semibold text-slate-100">{title}</h3>
    {description && (
      <p className="text-sm text-slate-400 mt-1 max-w-md leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6" aria-label="Cargando datos financieros">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((idx) => (
        <div key={idx} className="glass-card rounded-2xl p-5 space-y-3">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-8 w-36" />
          <div className="skeleton h-3 w-44" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-4">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    </div>
  </div>
)
