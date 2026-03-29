import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const databaseUrl = 'postgresql://postgres.yekovqaomhvdmiseghmf:Elmegatrol_123@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
});

async function findDuplicates() {
  try {
    await client.connect();

    const res = await client.query('SELECT producto_id, nombre, ultimo_precio_venta FROM public.productos_base');
    const products = res.rows;

    const normalize = (name) => {
      return name.toUpperCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") 
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

        if (p1.ultimo_precio_venta !== p2.ultimo_precio_venta) continue;

        const norm1 = normalize(p1.nombre);
        const norm2 = normalize(p2.nombre);

        if (norm1 === norm2) {
          candidates.push({ p1, p2, reason: 'Nombres idénticos (palabras desordenadas)' });
          continue;
        }

        if (norm1.startsWith(norm2) || norm2.startsWith(norm1)) {
            candidates.push({ p1, p2, reason: 'Uno es sufijo/prefijo del otro' });
        }
      }
    }

    fs.writeFileSync('duplicates_results.json', JSON.stringify(candidates, null, 2));
    console.log(`Se encontraron ${candidates.length} pares. Resultados guardados en duplicates_results.json`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findDuplicates();
