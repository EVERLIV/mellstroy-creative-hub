/** Which frontend binary is running (set at build/dev time). */
export type AppVariant = 'student' | 'trainer';

export function getAppVariant(): AppVariant {
  const raw = (import.meta.env.VITE_APP_VARIANT as string | undefined)?.toLowerCase();
  return raw === 'trainer' ? 'trainer' : 'student';
}

export function isStudentApp() {
  return getAppVariant() === 'student';
}

export function isTrainerApp() {
  return getAppVariant() === 'trainer';
}
