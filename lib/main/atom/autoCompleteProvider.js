var provider = {
    selector: '.source.ts',
    requestHandler: function (options) {
        console.log(options);
        return [];
    }
};
module.exports = provider;
