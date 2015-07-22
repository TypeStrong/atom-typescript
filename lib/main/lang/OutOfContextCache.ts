import fs = require("fs");

interface OutOfContextFile {
  fileName: string;
  outOfContextUntil: number;
}

export class OutOfContextCache {

  private files: {
    [index: string]: number;
  } = {};

  public setFileOutOfContext(fileName: string) {
    var timestamp = this.files[fileName];
    if (!timestamp) {
      console.log("Marking file " + fileName + " as out of context.");
      this.files[fileName] = OutOfContextCache.getCurrentMS() + OutOfContextCache.OutOfContextTimeoutInMS;
    }
  }

  public setFileOutOfContextIfExists(fileName: string) {
    if(fs.existsSync(fileName)) {
      this.setFileOutOfContext(fileName);
      return true;
    }
    return false;
  }

  public isOutOfContext(fileName: string) : boolean {
    //debugger;
    try {
      var timestamp = this.files[fileName];
      return (timestamp && !OutOfContextCache.shouldRecheck(timestamp));
    } catch (ex) {
      return false;
    }
  }

/*
  private checkFile(fileName: string) : boolean {
    if(fs.existsSync(fileName)) {
      this.files[fileName] = OutOfContextCache.getCurrentMS() +
        OutOfContextCache.OutOfContextTimeoutInMS;
      return true;
    } else {
      return false;
    }
  }*/

  private static getCurrentMS() {
    return new Date().getTime();
  }

  private static OutOfContextTimeoutInMS = 30000;

  private static shouldRecheck(timestamp: number) {
    return (timestamp + OutOfContextCache.OutOfContextTimeoutInMS < OutOfContextCache.getCurrentMS());
  }

}
