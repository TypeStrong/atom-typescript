"use strict";
const registry_1 = require("./registry");
registry_1.commands.set("typescript:clear-errors", deps => {
    return e => {
        deps.clearErrors();
    };
});
