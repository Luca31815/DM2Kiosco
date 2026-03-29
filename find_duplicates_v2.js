import pkg from 'pg';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function findDuplicates() {
  try {
    await client.connect();
    console.log('--- Buscando duplicados con la misma relación Nombre/Precio ---');

    const res = await client.query('SELECT producto_id, nombre, ultimo_precio_venta FROM public.productos_base');
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

        // REGLA 1: Deben tener el MISMO PRECIO para ser candidatos a duplicados
        if (p1.ultimo_precio_venta !== p2.ultimo_precio_venta) continue;

        const norm1 = normalize(p1.nombre);
        const norm2 = normalize(p2.nombre);

        // REGLA 2: Los nombres normalizados son idénticos (ej: "A B" === "B A")
        if (norm1 === norm2) {
          candidates.push({ p1, p2, reason: 'Nombres idénticos (palabras desordenadas)' });
          continue;
        }

        // REGLA 3: Uno es extensión del otro (ej: "FERNET" y "FERNET BRANCA")
        // Solo si la diferencia es pequeña o son palabras completas
        if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) {
            candidates.push({ p1, p2, reason: 'Uno es sufijo/prefijo del otro' });
        }
      }
    }

    if (candidates.length === 0) {
      console.log('No se encontraron duplicados potenciales con el mismo precio.');
    } else {
      console.log(`Se encontraron ${candidates.length} pares de posibles duplicados:`);
      console.table(candidates.map(c => ({
        'ID 1': c.p1.producto_id,
        'Prod 1': c.p1.nombre,
        'ID 2': c.p2.producto_id,
        'Prod 2': c.p2.nombre,
        'Precio': c.p1.ultimo_precio_venta,
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
