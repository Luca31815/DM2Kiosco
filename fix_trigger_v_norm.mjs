import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
  user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sqlFixTrigger = `
CREATE OR REPLACE FUNCTION public.fn_auto_learning_reservas()
RETURNS trigger AS $$
DECLARE 
    v_nombre_norm text; 
    v_precio numeric; 
BEGIN 
    IF current_setting('app.bypass_triggers', true) = 'true' THEN 
        RETURN NEW; 
    END IF; 
    
    v_nombre_norm := public.normalizar_texto(NEW.producto); 
    
    BEGIN 
        v_precio := (NEW.precio_unitario)::numeric; 
    EXCEPTION WHEN OTHERS THEN 
        v_precio := 0; 
    END; 
    
    -- CORRECCIÓN: Se cambió v_norm por v_nombre_norm
    INSERT INTO public.productos_base (nombre, ultimo_precio_venta, fecha_actualizacion) 
    VALUES (v_nombre_norm, v_precio, NOW()) 
    ON CONFLICT (nombre) 
    DO UPDATE SET 
        ultimo_precio_venta = EXCLUDED.ultimo_precio_venta, 
        fecha_actualizacion = NOW(); 
        
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sqlFixTrigger);
    console.log('Trigger fn_auto_learning_reservas FIXED (v_norm -> v_nombre_norm)');
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
