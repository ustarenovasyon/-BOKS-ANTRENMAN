import {settingsRepository} from '@/lib/localData/settingsRepository';
export const DEFAULT_APP_PREFERENCES=Object.freeze({sound:false,vibration:false,theme:'system'});
export async function loadAppPreferences() {
  const value=await settingsRepository.get('appPreferences',DEFAULT_APP_PREFERENCES);
  return {sound:value?.sound===true,vibration:value?.vibration===true,theme:['light','dark','system'].includes(value?.theme)?value.theme:'system'};
}
export async function saveAppPreferences(preferences) {
  const normalized={sound:preferences.sound===true,vibration:preferences.vibration===true,theme:['light','dark','system'].includes(preferences.theme)?preferences.theme:'system'};
  await settingsRepository.set('appPreferences',normalized);applyTheme(normalized.theme);return normalized;
}
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark',theme==='dark'||(theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches));
}
