import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';

const config = {
  input: 'src/kit/index.js',
  external: ['react', 'prop-types', 'react-redux', 'outernets-apps-core'],

  output: {
    format: 'umd',
    name: 'outernets-app-debugger',
    globals: {
      react: 'React'
    }
  },
  plugins: [
    babel({
      exclude: '/node_modules/'
    }),
    uglify(),
    postcss({
      plugins: [],
      namedExports: true,
      modules: true
    }),
    resolve({
      extensions: ['.js', '.jsx', '.json']
    })
  ]
};
export default config;
