import {isAndroidApp} from '@/lib/platform/androidBridge';
export function registerServiceWorker() {
 if(!isAndroidApp()&&import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).catch(error=>console.error('Çevrimdışı açılış önbelleği hazırlanamadı:',error)));
}
