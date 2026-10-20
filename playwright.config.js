import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:60000,workers:1,fullyParallel:false,
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:390,height:844},trace:'retain-on-failure',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{}},
  webServer:[{command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},{command:'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',url:'http://127.0.0.1:4174'+(process.env.GITHUB_ACTIONS?'/-BOKS-ANTRENMAN/':'/'),reuseExistingServer:!process.env.CI}],
});
