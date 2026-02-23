// mockData.js - Datos ficticios para el Modo Demo

export const MOCK_VENTAS = [
    { venta_id: 'VENTA_1001', fecha: '2026-02-23T10:00:00Z', cliente: 'Juan Pérez', total_venta: 15500, notas: 'Venta rápida' },
    { venta_id: 'VENTA_1002', fecha: '2026-02-23T09:30:00Z', cliente: 'María García', total_venta: 8200, notas: 'Pagó con QR' },
    { venta_id: 'VENTA_1003', fecha: '2026-02-22T20:15:00Z', cliente: 'Carlos Rodríguez', total_venta: 2500, notas: '' },
    { venta_id: 'VENTA_1004', fecha: '2026-02-22T19:00:00Z', cliente: 'Ana Martínez', total_venta: 12000, notas: 'Cliente recurrente' },
    { venta_id: 'VENTA_1005', fecha: '2026-02-22T15:45:00Z', cliente: 'Luisa Fernández', total_venta: 4500, notas: '' },
];

export const MOCK_PRODUCTOS = [
    { id: 1, nombre: 'Cigarrillos Red Point Común 20u', precio_venta: 2500, stock: 45 },
    { id: 2, nombre: 'Gaseosa Coca-Cola Original 2.25L', precio_venta: 3200, stock: 12 },
    { id: 3, nombre: 'Alfajor Jorgito Chocolate', precio_venta: 850, stock: 24 },
    { id: 4, nombre: 'Caramelos masticables surtidos', precio_venta: 100, stock: 150 },
    { id: 5, nombre: 'Agua Mineral Villavicencio 500ml', precio_venta: 1200, stock: 30 },
];

export const MOCK_COMPRAS = [
    { compra_id: 'COMPRA_5001', fecha: '2026-02-21T11:00:00Z', proveedor: 'Distribuidora Norte', total_compra: 85000, notas: 'Reposición mensual' },
];

export const MOCK_RESERVAS = [
    { reserva_id: 'RES_2001', cliente: 'Roberto Gómez', fecha: '2026-02-23T08:00:00Z', total_reserva: 5000, saldo_pendiente: 2000, estado_retiro: 'sin_entregar' },
];

export const MOCK_REPORTE_DIARIO = [
    { fecha: '2026-02-23', total_ventas: 23700, total_compras: 0, ganancia_neta: 8500 },
    { fecha: '2026-02-22', total_ventas: 45000, total_compras: 12000, ganancia_neta: 15000 },
];

export const MOCK_HISTORIAL = [
    { id: 1, fecha: '2026-02-23T10:05:00Z', mensaje: 'Venta registrada: Juan Pérez - $15.500', tipo: 'bot' },
    { id: 2, fecha: '2026-02-23T09:32:00Z', mensaje: 'Venta registrada: María García - $8.200', tipo: 'bot' },
];
