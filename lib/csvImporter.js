/**
 * Created by toby on 29/06/15.
 */

"use strict";

exports.import = (function() {
  var log = require("debug")("csvImporter");
  var helpers = require("./importHelpers");
  var fs = require("fs");
  var path = require("path");
  var util = require("util");
  var csvParse = require("csv-parse");
  var Throttle = require("stream-throttle").Throttle;
  var _ = require("lodash");

  /*
   * Constructor - initialise private variables.
   */
  function Importer() {
    this._queue = [];
    this._queueRunning = false;
    this._parseDone = false;
    this._processCount = 0;
    this._addedCount = 0;
    this._failedCount = 0;
    this._fieldMap = {};
  }

  /*
   * Entry point to the import process.
   *
   * @param cb will be called when the process has finished or an error has occurred.
   */
  Importer.prototype.start = function(config, cb) {
    var self = this;
    this._config = config;
    this._processCount = this._addedCount = this._failedCount = 0;
    this._queue = [];
    this._queueRunning = this._parseDone = false;
    this._fieldMap = {};

    log("starting with config %j",config);

    self._config.endLine = self._config.endLine === -1 ? Number.MAX_VALUE : self._config.endLine;
    self._config.throttleRate = self._config.throttleRate || 500;

    createFieldMap.call(self);
    startProcessing.call(self, cb);
  };

  /*
   * Decide how to proceed based on the defined processing mode.
   */
  var startProcessing = function(cb) {
    var self = this;
    log("running in '%s' mode", self._config.processingMode);
    switch (self._config.processingMode) {
      case "local":
        // local => download the file then process it entirely in memory.
        downloadThenProcess.call(self, cb);
        break;
      case "localStream":
        // localStream => download the file and process it in chunks.
        downloadThenProcess.call(self, cb);
        break;
      case "remoteStream":
        // remoteStream => stream from remote url and process it in chunks.
        processURL.call(self, self._config.sourceUrl, function(err) { checkFinished.call(self, err, cb); });
        break;
      default:
        log("unknown processing mode %s",self._config.processingMode);
        cb(new Error(util.format("unknown mode %s",self._config.processingMode)));
        break;
    }
  };

  /*
   * Creates a hash map of the dataset schema fields - for fast lookup.
   */
  var createFieldMap = function() {
    this._fieldMap = {};
    _.forEach(this._config.targetDataset.scheme.fields, function(f,i) {
      this._fieldMap[f.name] = f;
    }, this);
  };

  /*
   * Provides an opportunity to clean/transform data before it is added to the dataset.
   *
   * ToDo - expand this to cover common data mismatches.
   */
  var sanitiseData = function(targetDatasetField, data) {
    var transformed;

    if (targetDatasetField && targetDatasetField.storageType === "number" && typeof data === "string") {
      // Remove any commas from numeric string values (e.g. 4,300,000)
      transformed = parseFloat(data.replace(/,/g,''));
    } else {
      transformed = data;
    }
    return transformed;
  };

  /*
   * Use the schema defined in the dataset to build a new row from the sourceData.
   */
  var transformToSchema = function(sourceData) {
    var obj = {};
    if (this._config.schemaMapping && this._config.schemaMapping.length > 0) {
      // Use the configured schema mapping to copy data from the source data.
      _.forEach(this._config.schemaMapping, function(mapping,csvColumnIndex) {
        if (mapping.hasOwnProperty("target")) {
          // Dataset field target is defined in the configuration.
          obj[mapping.target] = sanitiseData(this._fieldMap[mapping.target],sourceData[csvColumnIndex]);
        } else {
          // No target defined so skip this column.
        }
      }, this);
    } else {
      // No schema mapping configured => map column order to dataset schema field order.
      _.forEach(sourceData, function(data,csvColumnIndex) {
        if (csvColumnIndex < this._config.targetDataset.scheme.fields.length) {
          var schemaField = this._config.targetDataset.scheme.fields[csvColumnIndex];
          obj[schemaField.name] = sanitiseData(schemaField,data);
        }
      }, this);
    }
    return obj;
  };

  /*
   * Sequentially processes all items in the FIFO queue.
   */
  var processQueue = function(cb) {
    var self = this;

    if (self._queue.length > 0 && self._processCount < self._config.endLine) {
      // Get the element at the front of the queue.
      var data = self._queue.shift();
      self._processCount++;

      if (self._processCount > self._config.startLine) {
        // Transform to dataset schema.
        var persist = transformToSchema.call(self, data);
        // Attempt to add the data to the dataset.
        helpers.addDatasetData(self._config.commandHost, self._config.targetDataset.id, persist, function(err) {
          if (err) {
            // Review - failed to add item, continue with other items or abort?
            log("failed to write line %j [%s]", data, err.message);
            self._failedCount++;
          } else {
            log("added data %j",data);
            self._addedCount++;
          }
          // Process next queue item.
          process.nextTick(function() { processQueue.call(self, cb); });
        });
      } else {
        // Skip to the next queue item.
        process.nextTick(function() { processQueue.call(self, cb); });
      }
    } else {
      // The queue is empty or we've processed all requested items => callback.
      cb();
    }
  };

  /*
   * Starts processing the queue.
   */
  var startQueue = function(cb) {
    var self = this;
    if (!self._queueRunning) {
      log("starting queue");
      self._queueRunning = true;
      processQueue.call(self, function() {
        log("queue empty");
        self._queueRunning = false;
        cb();
      });
    }
  };

  /*
   * Process a file stored locally.
   */
  var processLocalFile = function(filePath, cb) {
    var self = this;

    // Read the entire file into memory.
    fs.readFile(filePath, function(err, fileContents) {
      if (err) {
        // Problem loading file.
        return cb(err);
      }
      // Create the parser, passing it the file contents.
      var parser = csvParse(fileContents.toString(), { delimiter: self._config.delimiter }, function(err, data) {
        if (err) {
          // Problem in parser.
          return cb(err);
        }
        log("got %d lines of data",data.length);

        // Assign the data to the queue.
        self._queue = data;

        // Kick-off the processing of the received data.
        startQueue.call(self,function(err) {
          self._parseDone = true;
          cb(err);
        });
      });
    });
  };

  /*
   * Initialise the parser for receiving streamed input.
   */
  var setupStreamingParser = function(cb) {
    var self = this;

    // Create a parser.
    var parser = csvParse({ delimiter: self._config.delimiter });

    // Listen for "readable" events.
    parser.on("readable", function() {
      // Store received data items on the queue.
      var data = parser.read();
      while (data) {
        self._queue.push(data);
        data = parser.read();
      }
      // Start processing the queue.
      startQueue.call(self, cb);
    });

    // Listen for error events.
    parser.on("error", function(err) {
      log("failure during parsing: %s",err.message);
      cb(err);
    });

    // Listen for 'finish' events.
    parser.on("finish", function() {
      log("finished parsing");
      self._parseDone = true;
      cb();
    });

    return parser;
  };

  /*
   * Create a readable stream to a local file and pipe it into the parser.
   */
  var processLocalStream = function(filePath, cb) {
    var inputStream = fs.createReadStream(filePath);
    var parser = setupStreamingParser.call(this, cb);
    inputStream.pipe(new Throttle({ rate: this._config.throttleRate })).pipe(parser);
  };

  /*
   * Issue an http request for the resource and pipe the response into the parser.
   */
  var processURL = function(url, cb) {
    var self = this;
    var http = require("http");
    var parser = setupStreamingParser.call(this, cb);
    http.get(url, function(res) {
      if (res.statusCode === 200) {
        res.pipe(new Throttle({ rate: self._config.throttleRate })).pipe(parser);
      } else {
        cb(new Error(util.format("download failed with code %d",res.statusCode)));
      }
    });
  };

  /*
   * Handler for download-related processing modes.
   */
  var downloadThenProcess = function(cb) {
    var self = this;

    // Create a temporary file for downloading.
    self._downloadTarget = path.join("./", "download", "i-" + Date.now() + ".csv");

    // Attempt to download the file.
    log("starting download of %s to %s",self._config.sourceUrl,self._downloadTarget);
    helpers.downloadFile(self._config.sourceUrl, self._downloadTarget, function(err) {
      if (err) {
        log("download failed: %s",err.message);
        removeDownloadFile.call(self);
        cb(err);
      } else {
        log("downloaded file %s", self._config.sourceUrl);

        // Continue based on the configured processing mode.
        if (self._config.processingMode === "local") {
          processLocalFile.call(self, self._downloadTarget, function(err) { checkFinished.call(self, err, cb); });
        } else {
          processLocalStream.call(self, self._downloadTarget, function(err) { checkFinished.call(self, err, cb); });
        }
      }
    });
  };

  /*
   * Helper to delete the downloaded file if there is one.
   */
  var removeDownloadFile = function() {
    if (this._downloadTarget && this._downloadTarget.length > 0) {
      fs.unlink(this._downloadTarget);
    }
  };

  /*
   * Helper to check if the import process has finished.
   * n.b. this may be called multiple times depending on the processing mode.
   */
  var checkFinished = function(err, cb) {
    if (err) {
      // An error has occurred => delete any downloaded file and abort.
      removeDownloadFile.call(this);
      cb(err);
    }
    if (this._parseDone && this._queueRunning == false) {
      // Parsing has finished and the queue is empty => all done.
      removeDownloadFile.call(this);
      log("added %d items, %d failures",this._addedCount, this._failedCount);
      cb();
    }
  };

  return Importer;
}());