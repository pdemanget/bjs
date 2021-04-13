const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/b.js',
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'BJS',
      minify: false,
    }),
    new HtmlWebpackPlugin({
      template: './src/sample.pug',
      filename: 'sample.html',
      title: 'BJS sample',
      minify: false,
      inject: false,
    }),
  ],
  optimization: {
    minimize: false,
  },
  performance: {
    maxEntrypointSize: 512 * 1024,
    maxAssetSize: 512 * 1024,
  },
  module: {
    rules: [
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
      {
        test: /sample\.html$/,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    filename: 'b.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
