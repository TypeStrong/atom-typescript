var util = require('util');
var readings = {};
var zero = process.hrtime();

module.exports = function memoryReading(name){
  name = name || 'auto';
  if (name in readings) {
    var result = readings[name].compare(new MemoryReading(name + '-end'));
    delete readings[name];
    return result;
  } else {
    return readings[name] = new MemoryReading(name);
  }
}


function formatSize(s){
  if (isNaN(s) || s <= 0) return '0b';
  for (var b=0; s >= 1024; b++) s /= 1024;
  return (b ? s.toFixed(2)+' '+' kmgt'[b] : s+' ')+'b';
}

function MemoryReading(name, time){
  var reading = process.memoryUsage();
  this.timing = process.hrtime(time);
  this.name = name;
  this.time = process.hrtime(zero)[1];
  this.rss = reading.rss;
  this.total = reading.heapTotal;
  this.used = reading.heapUsed;
}

MemoryReading.prototype = {
  constructor: MemoryReading,
  compare: function compare(other){
    var first, last;
    if (other.time > this.time) {
      first = this;
      last = other;
    } else {
      first = other;
      last = this;
    }
    var out = Object.create(MemoryReading.prototype);
    out.start = first;
    out.end = last;
    out.name = first.name + ' to ' + last.name;
    out.time = last.time - first.time;
    out.rss = last.rss - first.rss;
    out.total = last.total - first.total;
    out.used = last.total - first.total;
    return out;
  },
  inspect: function(){
    return util.inspect({
      name: this.name,
      time: this.time / 1000000 | 0,
      rss: formatSize(this.rss),
      total: formatSize(this.total),
      used: formatSize(this.used)
    });
  }
};
