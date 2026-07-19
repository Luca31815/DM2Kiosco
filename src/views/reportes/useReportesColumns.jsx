import React, { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'
import { MES_NAMES } from './reportesHelpers'

export const useReportesColumns = (reportType) => {
    return useMemo(() => {
        const common = [
            { key: 'cant_ventas', label: 'Ventas', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-300 tabular-nums">{val}</span>
                </div>
            )},
            { key: 'cant_compras', label: 'Compras', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-slate-400 tabular-nums">{val}</span>
                </div>
            )},
            { key: 'ingresos', label: 'Ingresos', render: (val) => <span className="font-black text-emerald-400 tabular-nums">${Math.floor(val).toLocaleString()}</span> },
            { key: 'egresos', label: 'Egresos', render: (val) => <span className="font-black text-rose-400 tabular-nums">${Math.floor(val).toLocaleString()}</span> },
            { key: 'saldo', label: 'Balance', render: (val) => (
                <div className="flex items-center gap-1.5">
                    {val >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />}
                    <span className={`font-black tabular-nums ${val >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>${Math.floor(val).toLocaleString()}</span>
                </div>
            )},
        ]

        if (reportType === 'diario') {
            return [{ key: 'fecha', label: 'Fecha', render: (val) => {
                if (!val) return ''
                const [y, m, d] = val.split('-')
                const date = new Date(Number(y), Number(m) - 1, Number(d))
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black w-8">{dayName}</span>
                        <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                    </div>
                )
            }}, ...common]
        }

        if (reportType === 'semanal') {
            return [{ key: 'semana_del', label: 'Semana del', render: (val) => {
                if (!val) return ''
                const [y, m, d] = val.split('-')
                const start = new Date(Number(y), Number(m) - 1, Number(d))
                const end = new Date(start)
                end.setDate(start.getDate() + 6)
                const endStr = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{d}/{m}/{y}</span>
                        <ArrowRight className="h-3 w-3 text-slate-600" />
                        <span className="font-bold text-slate-400">{endStr}</span>
                    </div>
                )
            }}, ...common]
        }

        if (reportType === 'mensual') {
            return [{ key: 'mes', label: 'Mes', render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-black tabular-nums">{row.anio}</span>
                    <span className="font-bold text-slate-200">{MES_NAMES[Number(val)] || val}</span>
                </div>
            )}, ...common]
        }
        return common
    }, [reportType])
}
