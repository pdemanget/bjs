const path = require('path');
const TerserPlugin = require('terser-webpack-plugin'); // default webpack optimizer
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'b': './src/b.js',
    'b.min': './src/b.js',
  },
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.min\.js$/,
      }),
    ],
  },
  performance: {
    maxEntrypointSize: 512 * 1024,
    maxAssetSize: 512 * 1024,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'BJS',
      scriptLoading: 'blocking',
      inject: 'head',
      minify: false,
      chunks: ['b.min'],
    }),
    new HtmlWebpackPlugin({
      template: './src/sample.pug',
      filename: 'sample.html',
      title: 'BJS sample',
      scriptLoading: 'blocking',
      inject: 'head',
      minify: false,
      chunks: ['b.min'],
    }),
  ],
  devtool: "source-map",
  devServer: {
    sockPort: 'location',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        type: 'asset/resource',
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: 'pug-loader',
            options: {
              pretty: true,
            }
          },
        ],
      },
    ],
  },
};
