import React from 'react'
import { Trophy } from 'lucide-react'

export const HitosTimelineCell = ({ row, minHour, maxHour }) => {
    const startH = minHour
    const totalH = maxHour - minHour || 24

    const getPos = (timeStr) => {
        if (!timeStr) return -1
        let h, m
        try {
            if (typeof timeStr === 'string') {
                const part = timeStr.includes('T') ? timeStr.split('T')[1] : (timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr)
                if (!part || !part.includes(':')) return -1
                const [hStr, mStr] = part.split(':')
                h = parseInt(hStr, 10)
                m = parseInt(mStr, 10)
            } else if (timeStr instanceof Date) {
                h = timeStr.getHours()
                m = timeStr.getMinutes()
            } else {
                return -1
            }
        } catch {
            return -1
        }
        if (isNaN(h) || isNaN(m)) return -1
        const val = h + m / 60
        return ((val - startH) / totalH) * 100
    }

    const lastPos = row.lastSaleTime ? getPos(row.lastSaleTime) : -1

    return (
        <div className="relative w-full h-18 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            {Array.from({ length: totalH + 1 }).map((_, i) => (
                <div
                    key={`h-${i}`}
                    className="absolute top-0 bottom-0 border-r border-white/5 text-[9px] font-black text-slate-600 pt-1 px-1"
                    style={{ left: `${(i / totalH) * 100}%` }}
                >
                    <span>{startH + i}h</span>
                </div>
            ))}

            {row.milestones?.map(m => {
                const mPos = getPos(m.hour)
                if (mPos < 0 || mPos > 100) return null
                return (
                    <div
                        key={m.n}
                        className="absolute top-5 bottom-0 flex flex-col items-center group z-10"
                        style={{ left: `${mPos}%` }}
                    >
                        <div className="w-px h-full bg-yellow-500/40 group-hover:bg-yellow-500/80 transition-all duration-300"></div>
                        <div className="absolute top-[-16px] flex flex-col items-center">
                            <div className="bg-yellow-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-[0_0_15px_rgba(234,179,8,0.4)] transform -translate-x-1/2 flex items-center gap-1 group-hover:scale-110 transition-transform">
                                <Trophy className="h-2.5 w-2.5" />
                                {m.n}
                            </div>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-yellow-500 transform -translate-x-1/2"></div>
                        </div>
                    </div>
                )
            })}

            {lastPos >= 0 && lastPos <= 100 && (
                <div
                    className="absolute top-0 bottom-0 flex flex-col items-center group z-20"
                    style={{ left: `${lastPos}%` }}
                >
                    <div className="w-px h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                    <div className="absolute top-7 bg-blue-600 border border-blue-400/50 text-[10px] font-black text-white px-2 py-0.5 rounded-lg shadow-xl transform -translate-x-1/2">
                        {row.total_ventas} v.
                    </div>
                    <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-blue-600 mt-[-1.5px] shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                </div>
            )}
        </div>
    )
}
