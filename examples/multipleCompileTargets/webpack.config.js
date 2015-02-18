// Highly recommend : https://github.com/petehunt/webpack-howto

module.exports = {
    devServer: { // Only for the dev server
        contentBase: "./src/server/client/",
    },

    resolve: {
        extensions: ['','.ts', '.js']
    },

    // Source maps support
    devtool: 'source-map',

    // Add loader for .ts files.
    module: {
        loaders: [
          {
            test: /\.ts$/,
            loader: 'typescript-loader'
          }
        ]
    },

    entry: {
        app: ['./src/server/client/app/main.ts']
    },
    output: {
        path: './src/server/client/',
        filename: '[name].js' // Template based on keys in entry above
    }
};
