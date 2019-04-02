const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const root = `${__dirname}/..`;

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: ['./src/kit/index.js'],
  output: {
    path: path.resolve(root, 'dist'),
    filename: 'outernets-app-debugger.js',
    library: 'outernets-app-debugger',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  'env',
                  {
                    targets: {
                      browsers: 'last 2 Chrome versions'
                    }
                  }
                ],
                'react',
                'stage-1'
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                camelCase: true,
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: (loader) => [require('autoprefixer')()],
                config: {
                  ctx: {
                    autoprefixer: {
                      browsers: 'last 2 Chrome versions'
                    }
                  }
                }
              }
            }
          ]
        })
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader'
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new ExtractTextPlugin({
      filename: 'outernets-app-debugger.css'
    })
  ],
  resolve: {
    alias: {
      components: path.resolve(root, 'src/kit/components'),
      assets: path.resolve(root, 'src/kit/assets'),
      models: path.resolve(root, 'src/kit/models')
    },
    extensions: ['.js', '.jsx']
  }
};
