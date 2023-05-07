import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    format: 'cjs',
    dir: 'dist',
    sourcemap: true,
  },
  plugins: [typescript()],
};
