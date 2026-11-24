import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://mkqqctlfewvuxwcovnjo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcXFjdGxmZXd2dXh3Y292bmpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyMjMyMiwiZXhwIjoyMDkyNzk4MzIyfQ.vP0rvTPJUVSygB-3ctaAKuHPOejJPjAMQDaHl0llvm4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)