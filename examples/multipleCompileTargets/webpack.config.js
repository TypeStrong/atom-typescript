module.exports = {
    devServer: {
        contentBase: "./src/client",
    },
    entry: {
        app: ['./src/client/js/clientApp.js']
    },
    output: {
        path: './src/client',
        filename: 'js/bundle.js'
    }
};
