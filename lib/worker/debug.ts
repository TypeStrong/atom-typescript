/** Set this to true if you want to debug all things */
export var debugAll = false;

/** Set this to true to run the child code in the UI thread and just debug using the dev tools */
export var debugSync = false || debugAll;

/** Set this to true if you want to use to a file by file version of language service instead of the one in package.json */
export var debugLanguageService = false || debugAll;
