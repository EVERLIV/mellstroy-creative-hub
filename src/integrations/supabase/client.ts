/**
 * Compatibility shim: all previous Supabase imports now hit Firebase + local seed store.
 * Prefer importing from `@/src/integrations/firebase/client` going forward.
 */
export { firebaseClient as supabase, firebaseClient } from '../firebase/client';
