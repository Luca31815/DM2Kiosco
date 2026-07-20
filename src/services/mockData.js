// mockData.js - Datos ficticios para el Modo Demo / Vista Previa

export const MOCK_VENTAS = [
    { venta_id: 'VENTA_1001', fecha: '2026-02-23T10:00:00Z', cliente: 'Juan Pérez', total_venta: 15500, notas: 'Venta rápida' },
    { venta_id: 'VENTA_1002', fecha: '2026-02-23T09:30:00Z', cliente: 'María García', total_venta: 8200, notas: 'Pagó con QR' },
    { venta_id: 'VENTA_1003', fecha: '2026-02-22T20:15:00Z', cliente: 'Carlos Rodríguez', total_venta: 2500, notas: '' },
    { venta_id: 'VENTA_1004', fecha: '2026-02-22T19:00:00Z', cliente: 'Ana Martínez', total_venta: 12000, notas: 'Cliente recurrente' },
    { venta_id: 'VENTA_1005', fecha: '2026-02-22T15:45:00Z', cliente: 'Luisa Fernández', total_venta: 4500, notas: '' },
];

export const MOCK_PRODUCTOS = [
    { id: 1, nombre: 'Cigarrillos Red Point Común 20u', precio_venta: 2500, costo_actual: 1800, stock: 45 },
    { id: 2, nombre: 'Gaseosa Coca-Cola Original 2.25L', precio_venta: 3200, costo_actual: 2200, stock: 12 },
    { id: 3, nombre: 'Alfajor Jorgito Chocolate', precio_venta: 850, costo_actual: 450, stock: 24 },
    { id: 4, nombre: 'Caramelos masticables surtidos', precio_venta: 100, costo_actual: 45, stock: 150 },
    { id: 5, nombre: 'Agua Mineral Villavicencio 500ml', precio_venta: 1200, costo_actual: 700, stock: 30 },
];

export const MOCK_COMPRAS = [
    { compra_id: 'COMPRA_5001', fecha: '2026-02-21T11:00:00Z', proveedor: 'DISTRIBUIDORA NORTE', total_compra: 85000, notas: 'Reposición mensual' },
    { compra_id: 'COMPRA_5002', fecha: '2026-02-18T16:30:00Z', proveedor: 'GOLOMAX S.A.', total_compra: 42000, notas: 'Dulces y alfajores' },
];

export const MOCK_RESERVAS = [
    { reserva_id: 'RES_2001', cliente: 'Roberto Gómez', fecha: '2026-02-23T08:00:00Z', total_reserva: 5000, saldo_pendiente: 2000, estado_retiro: 'sin_entregar' },
    { reserva_id: 'RES_2002', cliente: 'Mariana López', fecha: '2026-02-22T14:20:00Z', total_reserva: 12500, saldo_pendiente: 0, estado_retiro: 'entregado' },
];

export const MOCK_REPORTE_DIARIO = [
    { fecha: '2026-02-23', total_ventas: 23700, total_compras: 0, ganancia_neta: 8500 },
    { fecha: '2026-02-22', total_ventas: 45000, total_compras: 12000, ganancia_neta: 15000 },
    { fecha: '2026-02-21', total_ventas: 68000, total_compras: 85000, ganancia_neta: 22000 },
    { fecha: '2026-02-20', total_ventas: 52000, total_compras: 42000, ganancia_neta: 18500 },
];

export const MOCK_HISTORIAL = [
    { id: 1, fecha: '2026-02-23T10:05:00Z', mensaje: 'Venta registrada: Juan Pérez - $15.500', tipo: 'bot' },
    { id: 2, fecha: '2026-02-23T09:32:00Z', mensaje: 'Venta registrada: María García - $8.200', tipo: 'bot' },
    { id: 3, fecha: '2026-02-22T20:16:00Z', mensaje: 'Reserva creada: Roberto Gómez - $5.000', tipo: 'bot' },
];

export const MOCK_PROVEEDORES = [
    { nombre: 'DISTRIBUIDORA NORTE', ultima_compra: '2026-02-21T11:00:00Z', total_compras_registradas: 15 },
    { nombre: 'GOLOMAX S.A.', ultima_compra: '2026-02-20T15:30:00Z', total_compras_registradas: 8 },
    { nombre: 'BEBIDAS DEL SUR', ultima_compra: '2026-02-18T10:00:00Z', total_compras_registradas: 12 },
];

export const MOCK_HISTORIAL_COMPRAS = [
    { producto: 'Gaseosa Coca-Cola Original 2.25L', proveedor: 'DISTRIBUIDORA NORTE', fecha: '2026-02-21T11:00:00Z', costo: 2200, cantidad: 24 },
    { producto: 'Gaseosa Coca-Cola Original 2.25L', proveedor: 'DISTRIBUIDORA NORTE', fecha: '2026-01-15T10:00:00Z', costo: 1950, cantidad: 24 },
    { producto: 'Gaseosa Coca-Cola Original 2.25L', proveedor: 'BEBIDAS DEL SUR', fecha: '2026-02-18T10:00:00Z', costo: 2100, cantidad: 12 },
    { producto: 'Alfajor Jorgito Chocolate', proveedor: 'GOLOMAX S.A.', fecha: '2026-02-20T15:30:00Z', costo: 450, cantidad: 60 },
];

export const MOCK_RENTABILIDAD = [
    { producto: 'Alfajor Jorgito Chocolate', unidades_vendidas: 120, ingreso_total: 102000, costo_total: 54000, ganancia: 48000, margen_porcentaje: 47.0 },
    { producto: 'Gaseosa Coca-Cola Original 2.25L', unidades_vendidas: 85, ingreso_total: 272000, costo_total: 187000, ganancia: 85000, margen_porcentaje: 31.25 },
    { producto: 'Cigarrillos Red Point Común 20u', unidades_vendidas: 150, ingreso_total: 375000, costo_total: 270000, ganancia: 105000, margen_porcentaje: 28.0 },
];

export const MOCK_ANALISIS_HORARIOS = [
    { hora: '09:00', total_ventas: 18500, cantidad_operaciones: 6 },
    { hora: '11:00', total_ventas: 34200, cantidad_operaciones: 12 },
    { hora: '15:00', total_ventas: 29000, cantidad_operaciones: 9 },
    { hora: '18:00', total_ventas: 58000, cantidad_operaciones: 21 },
    { hora: '21:00', total_ventas: 41500, cantidad_operaciones: 15 },
];

export const MOCK_RETIROS = [
    { id: 1, fecha: '2026-02-23T12:00:00Z', concepto: 'Retiro de caja medio día', monto: 15000, usuario: 'Operador Demo' },
    { id: 2, fecha: '2026-02-22T21:30:00Z', concepto: 'Cierre de caja turno noche', monto: 35000, usuario: 'Operador Demo' },
];

export const MOCK_DESCALCES = [
    { id: 1, fecha: '2026-02-22T19:30:00Z', venta_id: 'VENTA_1004', monto_registrado: 12000, monto_banco: 12000, estado: 'conciliado', diferencia: 0 },
];

