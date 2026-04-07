import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function findDuplicates() {
  try {
    await client.connect();
    console.log('--- Buscando duplicados con la misma relación Nombre/Precio/Costo ---');

    const res = await client.query('SELECT producto_id, nombre, ultimo_precio_venta, ultimo_costo_compra FROM public.productos_base');
    const products = res.rows;

    const normalize = (name) => {
      return name.toUpperCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Quitar puntuación
        .trim()
        .split(/\s+/)
        .sort()
        .join(" ");
    };

    const candidates = [];

    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const p1 = products[i];
        const p2 = products[j];

        const price1 = parseFloat(p1.ultimo_precio_venta || 0);
        const price2 = parseFloat(p2.ultimo_precio_venta || 0);
        const cost1 = parseFloat(p1.ultimo_costo_compra || 0);
        const cost2 = parseFloat(p2.ultimo_costo_compra || 0);

        const pricesMatch = price1 === price2 && price1 > 0;
        const costsMatch = cost1 === cost2 && cost1 > 0;

        // REGLA 1: Deben tener el MISMO PRECIO o MISMO COSTO para ser candidatos a duplicados
        if (!pricesMatch && !costsMatch) continue;

        const norm1 = normalize(p1.nombre);
        const norm2 = normalize(p2.nombre);

        let matchReason = '';
        if (norm1 === norm2) {
          matchReason = 'Nombres idénticos (palabras desordenadas)';
        } else if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) {
          matchReason = 'Uno es sufijo/prefijo del otro';
        }

        if (matchReason) {
            const reasonSuffix = costsMatch ? ' (Costo idéntico)' : ' (Precio idéntico)';
            candidates.push({ p1, p2, reason: matchReason + reasonSuffix });
        }
      }
    }

    if (candidates.length === 0) {
      console.log('No se encontraron duplicados potenciales con el mismo precio/costo.');
    } else {
      console.log(`Se encontraron ${candidates.length} pares de posibles duplicados:`);
      console.table(candidates.map(c => ({
        'ID 1': c.p1.producto_id,
        'Prod 1': c.p1.nombre,
        'ID 2': c.p2.producto_id,
        'Prod 2': c.p2.nombre,
        'Precio': c.p1.ultimo_precio_venta,
        'Costo': c.p1.ultimo_costo_compra,
        'Razón': c.reason
      })));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findDuplicates();
