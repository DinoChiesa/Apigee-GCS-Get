
/* jshint esversion:6, node:true, strict:implied */
/* global context, properties */

var prefix = properties.outputVarPrefix;
var c = JSON.parse(context.getVariable(properties.source));
for (var prop in c) {
  context.setVariable(prefix + prop, c[prop]);
}
