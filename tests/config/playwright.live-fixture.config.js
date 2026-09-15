const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:path.join(root, './tests/live'), testMatch:['fixture.spec.js','observer.spec.js'], timeout:60000, workers:1,
  outputDir:path.join(root, './test-results/live-fixture'), retries:0, forbidOnly:Boolean(process.env.CI),
  reporter:[['list',{printSteps:true}]],
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'firefox',testIgnore:'observer.spec.js',use:{browserName:'firefox'}}],
  use:{baseURL:'http://localhost:8888',trace:'off',screenshot:'off',video:'off'},
});
