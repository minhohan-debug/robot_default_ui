import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        'vue-i18n': resolve('node_modules/vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'),
      },
    },
    plugins: [
      vue(),
      VueI18nPlugin({
        include: resolve('src/renderer/src/locales/*.json'),
        runtimeOnly: true,
      }),
    ],
  },
});
