import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';

const config = {
  input: 'src/kit/index.js',
  external: ['react-redux'],
  output: {
    format: 'umd',
    name: 'outernets-app-debugger',
    globals: {
      react: 'React'
    }
  },
  plugins: [
    commonjs({
      include: "node_modules/**",
      namedExports: {
        'node_modules/react/react.js': ['Children', 'Component', 'PropTypes', 'createElement'],
        'node_modules/react-is/index.js': ['isValidElementType', 'isContextConsumer'],
        'node_modules/react-dom/index.js': ['render']
      }
    }),
    babel({
      exclude: '/node_modules/',
      plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime'],
      runtimeHelpers: true
    }),
    uglify(),
    postcss({
      plugins: [],
      namedExports: true,
      modules: true
    }),
    resolve({
      extensions: ['.js', '.jsx', '.json']
    }),
    json({
      exclude: ['/node_modules/'],
      preferConst: true,
      compact: true,
      namedExports: true
    })
  ]
};
export default config;
