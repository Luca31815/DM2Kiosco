import React from 'react'

const slots = [
    { key: 'ventas_madrugada', label: 'Madrugada (00-06)' },
    { key: 'ventas_manana', label: 'Mañana (06-13)' },
    { key: 'ventas_tarde', label: 'Tarde (13-19)' },
    { key: 'ventas_noche', label: 'Noche (19-00)' }
]

const HeatmapMode = React.memo(({ data }) => {
    const maxVal = Math.max(...data.flatMap(row => slots.map(s => Number(row[s.key] || 0))), 1)

    const getColor = (val) => {
        if (val === 0) return 'bg-slate-900/40 text-slate-700'
        const opacity = Math.max(0.3, val / maxVal)
        return `bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,${opacity * 0.4})] text-white border-purple-400/30`
    }

    return (
        <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 overflow-x-auto">
            <div className="min-w-[800px]">
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <div />
                    {slots.map(s => (
                        <div key={s.key} className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">{s.label}</div>
                    ))}
                </div>
                <div className="space-y-4">
                    {data.slice(0, 10).map((row, idx) => (
                        <div key={row.fecha || row.semana_del || row.id || idx} className="grid grid-cols-5 gap-4 items-center">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                                {new Date((row.fecha || row.semana_del) + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                            {slots.map(s => {
                                const val = Number(row[s.key] || 0)
                                return (
                                    <div
                                        key={s.key}
                                        className={`h-20 rounded-2xl flex flex-col justify-center items-center font-black text-2xl border ${getColor(val)}`}
                                    >
                                        {val}
                                        <span className="text-[9px] opacity-60 uppercase mt-1 tracking-widest">vnts</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
})

HeatmapMode.displayName = 'HeatmapMode'

export default HeatmapMode
