import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    experimental: {
      remoteFunctions: true
    },
    adapter: adapter({
      config: "wrangler.jsonc",
      platformProxy: {
        configPath: 'wrangler.jsonc',
        persist: true
      },
      fallback: 'plaintext',
    })
  },
  compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
