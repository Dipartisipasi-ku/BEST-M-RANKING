const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `if (!unitError && remoteUnits && remoteUnits.length > 0) {`;
const replacement = `if (!unitError && remoteUnits && remoteUnits.length === 0) {
          // Auto-seed to Supabase if empty (helps fresh DBs)
          const seedPayload = INITIAL_UNITS.map(u => ({
            id: u.id,
            nama: u.nama,
            kategori: u.kategori,
            lokasi: u.lokasi || null,
            kepala_ruangan: u.kepalaRuangan || null,
          }));
          const { error: seedErr } = await supabase!.from('units').upsert(seedPayload);
          if (seedErr) {
             console.error('Failed to auto-seed units:', seedErr);
          } else {
             console.log('Successfully auto-seeded units to Supabase');
          }
        }
        
        if (!unitError && remoteUnits && remoteUnits.length > 0) {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
