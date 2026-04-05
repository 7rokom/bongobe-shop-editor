// Untyped supabase client for tables not yet in auto-generated types
import { supabase } from '@/integrations/supabase/client';

// Cast to bypass strict table name typing when tables exist in DB but not in generated types
export const db = supabase as any;
