// Highly recommend : https://github.com/petehunt/webpack-howto

module.exports = {
    devServer: { // Only for the dev server
        contentBase: "./src/server/client/",
    },

    // Add .ts as a valid extension for webpack
    // Source maps support
    // Add loader for .ts files.
    resolve: {
        extensions: ['','.ts', '.js']
    },
    devtool: 'source-map',
    module: {
        loaders: [
          {
            test: /\.ts$/,
            loader: 'typescript-loader'
          }
        ]
    },

    // Your app configuration
    entry: {
        app: ['./src/server/client/app/main.ts']
    },
    output: {
        path: './src/server/client/',
        filename: '[name].js' // Template based on keys in entry above
    }
};
