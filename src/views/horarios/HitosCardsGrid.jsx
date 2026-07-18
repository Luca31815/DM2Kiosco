import React from 'react'

export const HitosCardsGrid = ({ hitosRawData }) => {
    if (!hitosRawData?.hitos?.length) return null

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[10, 20, 30, 40].map(n => {
                let sumMinutes = 0
                let count = 0

                hitosRawData.hitos.forEach(h => {
                    if (h.hito_logrado === n && h.hora_exacta) {
                        const [hStr, mStr] = h.hora_exacta.split(':')
                        const minutesSinceOpening = (parseInt(hStr, 10) * 60 + parseInt(mStr, 10)) - (8 * 60)
                        if (minutesSinceOpening > 0) {
                            sumMinutes += minutesSinceOpening
                            count++
                        }
                    }
                })

                const avgMinutes = count > 0 ? (sumMinutes / count) : 0
                const avgH = Math.floor(avgMinutes / 60)
                const avgM = Math.round(avgMinutes % 60)

                let displayH = 8 + avgH
                let displayM = avgM
                if (displayM >= 60) {
                    displayH += 1
                    displayM -= 60
                }

                const avgTime = count > 0 ? `${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}` : '--:--'

                return (
                    <div
                        key={n}
                        className="bg-slate-900 p-6 rounded-2xl flex flex-col items-center group relative overflow-hidden border border-white/5"
                    >
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Hito {n} Ventas</span>
                        <span className="text-4xl font-black text-yellow-500 mt-2 tabular-nums">{avgTime} <span className="text-sm font-medium text-slate-600">hs</span></span>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic leading-none">Promedio en {count} días</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
