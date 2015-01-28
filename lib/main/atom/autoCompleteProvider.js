var provider = {
    selector: '.source.js,.source.ts',
    requestHandler: function (options) {
        console.log(options);
        return [];
    }
};
module.exports = provider;
