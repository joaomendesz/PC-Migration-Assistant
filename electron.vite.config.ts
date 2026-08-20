import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))
const fromRoot = (...paths: string[]): string => resolve(root, ...paths)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': fromRoot('src/main'),
        '@shared': fromRoot('src/shared'),
      },
    },
    build: {
      rollupOptions: {
        input: fromRoot('src/main/index.ts'),
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        '@preload': fromRoot('src/preload'),
        '@shared': fromRoot('src/shared'),
      },
    },
    build: {
      rollupOptions: {
        input: fromRoot('src/preload/index.ts'),
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name]-[hash].cjs',
        },
      },
    },
  },
  renderer: {
    root: fromRoot('src/renderer'),
    resolve: {
      alias: {
        '@renderer': fromRoot('src/renderer/src'),
        '@shared': fromRoot('src/shared'),
      },
    },
    plugins: [react()],
  },
})
