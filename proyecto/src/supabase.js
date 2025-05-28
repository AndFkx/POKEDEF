import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = 'https://fcmzkcpfmyockmdnwlwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbXprY3BmbXlvY2ttZG53bHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODMyMDMsImV4cCI6MjA2Mzg1OTIwM30.560Rx3V07AXUHB-eqZHEcGbco-WsuHwBU1jc_M88zQA';
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function validarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return session.user;
  } else {
    return null;
  }
}