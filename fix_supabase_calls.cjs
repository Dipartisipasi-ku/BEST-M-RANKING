const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /await supabase\.from\('evaluation_records'\)\.upsert\(dbPayload\);/g,
  `const { error } = await supabase.from('evaluation_records').upsert(dbPayload);
        if (error) {
          console.error('Supabase upsert error:', error);
          showToast('Gagal sinkronisasi ke Supabase: ' + error.message);
        }`
);

code = code.replace(
  /await supabase\.from\('evaluation_records'\)\.delete\(\)\.eq\('id', id\);/g,
  `const { error } = await supabase.from('evaluation_records').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
          showToast('Gagal hapus di Supabase: ' + error.message);
        }`
);

code = code.replace(
  /await supabase\.from\('units'\)\.upsert\(\{\s+id: newUnit\.id,\s+nama: newUnit\.nama,\s+kategori: newUnit\.kategori,\s+lokasi: newUnit\.lokasi \|\| null,\s+kepala_ruangan: newUnit\.kepalaRuangan \|\| null,\s+\}\);/g,
  `const { error } = await supabase.from('units').upsert({
          id: newUnit.id,
          nama: newUnit.nama,
          kategori: newUnit.kategori,
          lokasi: newUnit.lokasi || null,
          kepala_ruangan: newUnit.kepalaRuangan || null,
        });
        if (error) {
          console.error('Supabase unit insert error:', error);
          showToast('Gagal simpan unit ke Supabase: ' + error.message);
        }`
);

code = code.replace(
  /await supabase\.from\('units'\)\.upsert\(\{\s+id: updatedUnit\.id,\s+nama: updatedUnit\.nama,\s+kategori: updatedUnit\.kategori,\s+lokasi: updatedUnit\.lokasi \|\| null,\s+kepala_ruangan: updatedUnit\.kepalaRuangan \|\| null,\s+\}\);/g,
  `const { error } = await supabase.from('units').upsert({
          id: updatedUnit.id,
          nama: updatedUnit.nama,
          kategori: updatedUnit.kategori,
          lokasi: updatedUnit.lokasi || null,
          kepala_ruangan: updatedUnit.kepalaRuangan || null,
        });
        if (error) {
          console.error('Supabase unit update error:', error);
          showToast('Gagal update unit ke Supabase: ' + error.message);
        }`
);

code = code.replace(
  /await supabase\.from\('units'\)\.delete\(\)\.eq\('id', unitId\);/g,
  `const { error } = await supabase.from('units').delete().eq('id', unitId);
          if (error) {
            console.error('Supabase unit delete error:', error);
            showToast('Gagal hapus unit di Supabase: ' + error.message);
          }`
);

code = code.replace(
  /await supabase\.from\('evaluation_records'\)\.upsert\(payloads\);/g,
  `const { error } = await supabase.from('evaluation_records').upsert(payloads);
        if (error) {
          console.error('Supabase bulk upsert error:', error);
          showToast('Gagal bulk save ke Supabase: ' + error.message);
        }`
);

fs.writeFileSync('src/App.tsx', code);
