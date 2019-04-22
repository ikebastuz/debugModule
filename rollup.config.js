import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

const config = {
  input: 'src/kit/index.js',
  external: [
    'react',
    'prop-types',
    'react-redux',
    'react-detect-offline',
    'classnames',
    'uuidv1'
  ],

  output: {
    format: 'umd',
    name: 'outernets-app-debugger',
    globals: {
      react: 'React'
    }
  },
  plugins: [
    babel({
      exclude: '/node_modules/',
      plugins: ['@babel/plugin-proposal-class-properties']
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
