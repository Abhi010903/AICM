import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [
    {
      name: 'geojson-loader',
      transform(code, id) {
        if (id.endsWith('.geojson')) {
          return {
            code: `export default ${code};`,
            map: null,
          };
        }
      },
    },
  ],
});
