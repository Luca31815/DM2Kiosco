import pg from 'pg';
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const q = `
    WITH ops AS (
        SELECT public.normalizar_texto(vd.producto) AS nom_norm
        FROM public.ventas_detalles vd
        WHERE vd.producto IS NOT NULL AND vd.producto <> ''
        UNION ALL
        SELECT public.normalizar_texto(cd.producto)
        FROM public.compras_detalles cd
        WHERE cd.producto IS NOT NULL AND cd.producto <> ''
        UNION ALL
        SELECT public.normalizar_texto(rd.producto)
        FROM public.reservas_detalles rd
        WHERE rd.producto IS NOT NULL AND rd.producto <> ''
    ),
    clean AS (
        SELECT public.normalizar_texto(producto) AS nom_norm FROM public.ventas_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.compras_detalles WHERE producto IS NOT NULL
        UNION
        SELECT public.normalizar_texto(producto) FROM public.reservas_detalles WHERE producto IS NOT NULL
    )
    SELECT DISTINCT ops.nom_norm
    FROM ops
    WHERE ops.nom_norm NOT IN (SELECT nom_norm FROM clean WHERE nom_norm IS NOT NULL);
  `;
  const res = await client.query(q);
  console.log('Difference:', res.rows);
  await client.end();
}
run();
