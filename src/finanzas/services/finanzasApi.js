import { supabase } from '../../lib/supabase'
import { toNumber } from '../utils/formatters'
import { normalizeResumenMensual } from './normalizeResumen'

export { normalizeResumenMensual }

async function callRpc(fnName, params = {}) {
  const { data, error } = await supabase.rpc(fnName, params)
  if (error) {
    const err = new Error(error.message || `Error ejecutando ${fnName}`)
    err.code = error.code
    err.details = error.details
    throw err
  }
  return data
}

export const finanzasApi = {
  async fetchResumenMensual(periodoYm) {
    const raw = await callRpc('fn_finanzas_resumen_mensual', {
      p_periodo_ym: periodoYm,
    })
    return normalizeResumenMensual(raw, periodoYm)
  },

  async generarMes(periodoYm) {
    return callRpc('fn_finanzas_generar_mes', {
      p_periodo_ym: periodoYm,
    })
  },

  async upsertMesConfig(periodoYm, sueldoKioscoObjetivo, notas = null) {
    return callRpc('fn_finanzas_upsert_mes_config', {
      p_periodo_ym: periodoYm,
      p_sueldo_kiosco_objetivo: toNumber(sueldoKioscoObjetivo, 0),
      p_notas: notas === '' ? null : notas,
    })
  },

  async upsertObjetivos(periodoYm, objetivos, sueldoKioscoObjetivo = null, notas = null) {
    return callRpc('fn_finanzas_upsert_objetivos', {
      p_periodo_ym: periodoYm,
      p_objetivos: Array.isArray(objetivos) ? objetivos : [],
      p_sueldo_kiosco_objetivo:
        sueldoKioscoObjetivo === null || sueldoKioscoObjetivo === undefined
          ? null
          : toNumber(sueldoKioscoObjetivo, 0),
      p_notas: notas === '' ? null : notas,
    })
  },

  async fetchProveedoresCatalogo() {
    const raw = await callRpc('fn_finanzas_proveedores_catalogo')
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.proveedores)) return raw.proveedores
    if (Array.isArray(raw?.items)) return raw.items
    return []
  },

  async fetchGastosLogisticosMes(periodoYm) {
    return callRpc('fn_finanzas_gastos_logisticos_mes', {
      p_periodo_ym: periodoYm,
    })
  },

  async crudReglaLogistica(accion, payload = {}) {
    return callRpc('fn_finanzas_crud_regla_logistica', {
      p_accion: accion,
      p_payload: payload,
    })
  },

  async crudIngreso(accion, payload = {}) {
    return callRpc('fn_finanzas_crud_ingreso', {
      p_accion: accion,
      p_payload: payload,
    })
  },

  async crudGasto(accion, payload = {}) {
    return callRpc('fn_finanzas_crud_gasto', {
      p_accion: accion,
      p_payload: payload,
    })
  },

  async crudDeuda(accion, payload = {}) {
    return callRpc('fn_finanzas_crud_deuda', {
      p_accion: accion,
      p_payload: payload,
    })
  },
}

export default finanzasApi
