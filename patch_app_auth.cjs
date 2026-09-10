const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the initial session loading state to null instead of localStorage
code = code.replace(
  /const \[session, setSession\] = useState<AuthSession \| null>\(\(\) => \{[\s\S]*?\}\);/,
  `const [session, setSession] = useState<AuthSession | null>(null);`
);

// Add useEffect to listen to Supabase Auth
if (!code.includes("supabase.auth.onAuthStateChange")) {
  code = code.replace(
    "useEffect(() => {",
    `useEffect(() => {
    const checkAuth = async () => {
      if (supabase) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
          if (profile) {
            setSession({
              role: profile.role,
              unitId: profile.unit_id || 'all',
              unitNama: units.find((u: Unit) => u.id === profile.unit_id)?.nama || 'Semua Unit',
              userName: profile.full_name,
              nip: profile.nip,
              jabatan: profile.jabatan
            });
          }
        }
      }
    };
    checkAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
        } else if (currentSession?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
          if (profile) {
            setSession({
              role: profile.role,
              unitId: profile.unit_id || 'all',
              unitNama: units.find((u: Unit) => u.id === profile.unit_id)?.nama || 'Semua Unit',
              userName: profile.full_name,
              nip: profile.nip,
              jabatan: profile.jabatan
            });
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [units]);
  
  useEffect(() => {`
  );
}

// Add sign out logic
code = code.replace(
  /onClick=\{handleLogout\}/,
  `onClick={async () => {
                if (supabase) await supabase.auth.signOut();
                handleLogout();
              }}`
);

fs.writeFileSync('src/App.tsx', code);
