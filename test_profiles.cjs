const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://hgxtsgiabjkofimgbwek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHRzZ2lhYmprb2ZpbWdid2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTA4NDQsImV4cCI6MjEwMzk4Njg0NH0.MDW8sDk04fzxko8ZN8piEWBYE7zxTDzExdjQNafTXxY';

const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from('profiles').select('id, role, unit_id').then(res => console.log("Profiles:", res)).catch(err => console.error(err));
