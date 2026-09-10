const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf-8');

code = code.replace(
  'onChange={(e) => setRole(e.target.value as AppRole)}',
  `onChange={(e) => {
                      const newRole = e.target.value as AppRole;
                      setRole(newRole);
                      if (newRole === 'staf_pegawai' && unitId) {
                        try {
                          const saved = localStorage.getItem(\`unit_staff_\${unitId}\`);
                          setStaffList(saved ? JSON.parse(saved) : []);
                          setFullName(''); // reset selected staff
                        } catch { setStaffList([]); }
                      }
                    }}`
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
