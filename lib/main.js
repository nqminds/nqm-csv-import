/**
 * Created by toby on 29/06/15.
 */
"use strict";

(function() {
  // For debug output.
  var log = require("debug")("index");

  // Get the configuration.
  var configFile = process.argv.length > 2 ? process.argv[2] : "config.js";
  var config = require("../" + configFile);

  // Get the CSV import module.
  var CSVImport = require("./csvImporter").import;

  // Create an CSV importer instance.
  var importer = new CSVImport();

  // Initiate the import with our configuration.
  importer.start(config, function(err) {
    if (err) {
      log("failed to import: %s", err.message);
    } else {
      log("import finished");
    }
  });
}());