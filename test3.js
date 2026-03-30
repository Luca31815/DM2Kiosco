import * as api from './src/services/api.js';

async function run() {
    const res = await api.getProductos({ page: 1, pageSize: 3000, select: 'producto_id,nombre,ultimo_precio_venta,stock_actual,ultimo_costo_compra' });
    const productos = res.data;
    console.log("Fetched productos count:", productos?.length);
}
run();
