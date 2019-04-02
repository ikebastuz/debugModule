const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const root = `${__dirname}/..`;

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    app: path.resolve(root, 'src/kit/index.js'),
    vendor: ['react', 'react-dom']
  },
  output: {
    path: path.resolve(root, 'dist/kit'),
    filename: 'www/[name].[hash].js',
    publicPath: './'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              plugins: ['react-hot-loader/babel'],
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
    new HtmlWebpackPlugin({
      template: path.resolve(root, 'src/kit/index.html'),
      title: 'Kit App'
    }),
    new ExtractTextPlugin({
      filename: 'www/styles.[hash].css',
      allChunks: true
    })
  ],
  resolve: {
    alias: {
      components: path.resolve(root, 'src/kit/components'),
      assets: path.resolve(root, 'src/kit/assets'),
      models: path.resolve(root, 'src/kit/models')
    },
    extensions: ['.js', '.jsx']
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          test: 'vendor',
          name: 'vendor',
          enforce: true
        }
      }
    }
  }
};
