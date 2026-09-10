const fs = require('fs');

let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

const insertCode = `
        if (role === 'kepala_ruangan' && unitId) {
          const { data: existingProfiles, error: countError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'kepala_ruangan')
            .eq('unit_id', unitId)
            .limit(1);
            
          if (!countError && existingProfiles && existingProfiles.length > 0) {
            setError('Pendaftaran ditolak: Sudah ada akun Kepala Ruangan untuk unit/instalasi yang dipilih. Hanya diperbolehkan maksimal 1 (satu) Kepala Ruangan per unit.');
            setIsLoading(false);
            return;
          }
        }
`;

const replaceTarget = `if (isRegistering) {
        // Sign Up (Real Supabase Auth)`;

code = code.replace(replaceTarget, `if (isRegistering) {
        // Sign Up (Real Supabase Auth)${insertCode}`);

fs.writeFileSync('src/components/LoginPage.tsx', code);
