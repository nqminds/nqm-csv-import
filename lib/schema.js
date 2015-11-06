/**
 * Created by toby on 05/11/15.
 */

var log = require("debug")("csvImporter");
var fs = require("fs");
var path = require("path");
var csvParse = require("csv-parse");
var _ = require("lodash");

function isNumeric(val) {
  return Number(parseFloat(val))==val;
}

exports.inferSchema = function(filePath, checkLines, delimiter, cb) {
  "use strict";
  
  var schema = [];
  var done = false;
  var gotSchema = false;
  
  var parserOptions = {
    skip_empty_lines: true,
    trim: true,
    delimiter: delimiter
  };
  
  var endProcessing = function() {
    log("line reader ended");
    var ds = {
      name: path.basename(filePath, path.extname(filePath)),
      schema: {}
    };
    _.forEach(schema, function(field) {
      ds.schema[field.name] = {
        type: field.type,
        index: field.index
      }
    });
    log("import config is ", ds);
    gotSchema = true;
    cb(null, ds);
  };
  
  var processLine = function(cols) {
    log(cols);
    if (!done) {
      if (schema.length === 0) {
        _.forEach(cols, function (col) {
          schema.push({
            name:  col,
            type:  "Number",
            index: false
          });
        });
      } else {
        _.forEach(cols, function (col, i) {
          if (!isNumeric(col)) {
            schema[i].type = "String";
          }
        });
        done = (--checkLines) <= 0;
      }
    } else {
      inputStream.destroy();
      if (!gotSchema) {
        endProcessing();
      }
    }
  };  
  
  // Create a parser.
  var parser = csvParse(parserOptions);
  
  // Listen for "readable" events.
  parser.on("readable", function() {
    // Store received data items on the queue.
    var data = parser.read();
    while (data) {
      processLine(data);
      data = parser.read();
    }
  });
  
  // Listen for error events.
  parser.on("error", function(err) {
    log("failure during parsing: %s",err.message);
    cb(err);
  });
  
  // Listen for 'finish' events.
  parser.on("finish", function() {
    log("finished parsing");
    endProcessing();
  });
  
  var inputStream = fs.createReadStream(filePath);
  inputStream.pipe(parser);
};
