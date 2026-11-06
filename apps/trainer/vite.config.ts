import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  return {
    root: __dirname,
    publicDir: path.resolve(root, 'public'),
    envDir: root,
    server: {
      port: 8081,
      host: '0.0.0.0',
      fs: { allow: [root] },
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
    css: {
      postcss: {
        plugins: [tailwindcss({ config: path.resolve(root, 'tailwind.config.ts') }), autoprefixer],
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_APP_VARIANT': JSON.stringify('trainer'),
    },
    resolve: {
      alias: {
        '@': root,
      },
    },
    build: {
      outDir: path.resolve(root, 'dist/trainer'),
      emptyOutDir: true,
    },
  };
});
