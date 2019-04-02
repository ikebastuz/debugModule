const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = `${__dirname}/..`;

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: path.resolve(root, 'src/kit/index.js'),
    vendor: [
      'react',
      'react-dom'
    ],
  },
  output: {
    path: path.resolve(root, 'dist/kit'),
    filename: '[name].[hash].js',
    publicPath: '/'
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
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              camelCase: true,
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader'
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(root, 'src/kit/index.html'),
      title: 'Kit App'
    })
  ],
  resolve: {
    alias: {
      'components': path.resolve(root, 'src/kit/components'),
      'assets': path.resolve(root, 'src/kit/assets'),
      'models': path.resolve(root, 'src/kit/models')
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
  },
  devServer: {
    host: 'localhost',
    port: 3001,
    historyApiFallback: true,
    open: true,
    hot: true
  }
};
