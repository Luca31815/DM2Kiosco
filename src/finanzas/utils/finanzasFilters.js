export function filterGastosEspecificos(
  items = [],
  { ambito = 'todos', categoria = 'todas', search = '' } = {}
) {
  const q = String(search || '').trim().toLowerCase()
  return (items || []).filter((item) => {
    if (item.es_recurrente) return false
    if (ambito !== 'todos' && item.ambito !== ambito) return false
    if (categoria !== 'todas' && (item.categoria || 'Otros') !== categoria) return false
    if (q) {
      const hay = `${item.nombre || ''} ${item.categoria || ''} ${item.notas || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function filterGastosRecurrentes(
  items = [],
  { ambito = 'todos', estado = 'todos' } = {}
) {
  return (items || []).filter((item) => {
    if (!item.es_recurrente) return false
    if (ambito !== 'todos' && item.ambito !== ambito) return false
    if (estado === 'pendiente' && item.estado_pago === 'pagado') return false
    if (estado === 'pagado' && item.estado_pago !== 'pagado') return false
    return true
  })
}

export function filterDeudas(items = [], { estado = 'activa', ambito = 'todos' } = {}) {
  return (items || []).filter((d) => {
    if (estado !== 'todas' && d.estado !== estado) return false
    if (ambito !== 'todos' && d.ambito !== ambito) return false
    return true
  })
}
