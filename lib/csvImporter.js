/**
 * Created by toby on 29/06/15.
 */

exports.import = (function() {
  "use strict";

  var log = require("debug")("log");
  var debug = require("debug")("debug");
  var helpers = require("nqm-common-import");
  var fs = require("fs");
  var path = require("path");
  var util = require("util");
  var csvParse = require("csv-parse");
  var Throttle = require("stream-throttle").Throttle;
  var moment = require("moment");
  var _ = require("lodash");
  var inferSchema = require("./schema").inferSchema;
  
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
   * @param config the configuration object defining the import.
   * @param cb will be called when the process has finished or an error has occurred.
   */
  Importer.prototype.start = function(config, cb) {
    var self = this;
    this._config = config;
    this._processCount = this._addedCount = this._failedCount = 0;
    this._queue = [];
    this._bulkQueue = [];
    this._queueRunning = this._parseDone = false;
    this._fieldMap = {};
    this._headers = [];
    this._accessToken = "";
  
    // Set defaults.
    self._config.startLine = self._config.startLine || 1;
    self._config.endLine = (!self._config.endLine || self._config.endLine === -1) ? Number.MAX_VALUE : self._config.endLine;
    self._config.encoding = self._config.encoding || "utf8";
    self._config.delimiter = self._config.delimiter || ",";
    self._config.processingMode = self._config.processingMode || "localStream";
    self._config.throttleRate = self._config.throttleRate || 10000;
    self._config.commandHost = self._config.commandHost || "http://cmd.nqminds.com";
    self._config.bulkCount = self._config.bulkCount || 100;
    self._config.primaryKey = self._config.primaryKey || [];
    self._config.upsertMode = self._config.upsertMode !== false;
    self._config.inferSchema = self._config.inferSchema || !self._config.schema;
    self._config.inferSchemaCount = self._config.inferSchemaCount || 100;
    self._config.datasetName = self._config.datasetName || (path.basename(self._config.sourceFile, path.extname(self._config.sourceFile)) + " [" + moment().format("D MMM YYYY H:mm:ss") + "]");

    if (self._config.upsertMode && self._config.primaryKey.length === 0) {
      log("forcing non-upsert mode since there is no primary key defined");
      self._config.upsertMode = false;
    }
  
    log("starting with config %j",config);
  
    this._parserOptions = {
      skip_empty_lines: true,
      trim: true,
      delimiter: self._config.delimiter
    };
  
    if (self._config.schema) {
      self._fieldMap = helpers.utils.createFieldMap(self._config.schema);
      getAccessToken.call(self,cb);
    } else if (self._config.inferSchema) {
      inferSchema.call(self, self._config.sourceFile, self._config.inferSchemaCount, self._config.delimiter, function(err, details) {
        if (err) {
          log("error inferring schema: %s",err.message);
          process.abort();
        } 
        self._config.schema = details.schema;
        self._fieldMap = helpers.utils.createFieldMap(self._config.schema);
        getAccessToken.call(self,cb);
      });
    } else {
      log("no schema");
      process.exit();
    }
  };

  var getAccessToken = function(cb) {
    var self = this;
    if (self._config.credentials) {
      helpers.commands.getAccessToken(self._config.commandHost, self._config.credentials, function(err, accessToken) {
        if (err) {
          cb(err);
        } else {
          self._accessToken = accessToken;
          if (!self._config.targetDataset) {
            helpers.commands.createTargetDataset(
              self._config.commandHost, 
              self._accessToken, 
              self._config.datasetName,
              self._config.schema,
              self._config.primaryKey,
                function(err, ds) {
                if (err) {
                  return cb(err);
                } 
                self._config.targetDataset = ds;
                startProcessing.call(self, cb);
              });
          } else {
            startProcessing.call(self, cb);
          }
        }
      });
    } else {
      startProcessing.call(self, cb);
    }
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
   * Use the schema defined in the dataset to build a new row from the sourceData.
   */
  var transformToSchema = function(sourceData) {
    var self = this;
    var obj = {};
  
    var setField = function(field, data) {
      var sanitised = helpers.utils.sanitiseData(self._fieldMap[field].type, data);
      helpers.utils.setData(obj, field, sanitised, self._fieldMap[field].isArray);
    };
  
    if (this._config.schemaMapping) {
      _.forEach(this._headers, function(col, i) {
        if (this._config.schemaMapping.hasOwnProperty(col)) {
          var target = this._config.schemaMapping[col];
          if (target.length > 0) {
            // Dataset field target is defined in the schema mapping configuration.
            setField(this._config.schemaMapping[col], sourceData[i]);
          } else {
            // Dataset field target is blank => skip this column.
          }
        } else {
          // No target defined => use header column.
          setField(col, sourceData[i]);
        }
      }, this);
    } else {
      // No explicit schema mapping => assume schema is based on the CSV headers.
      _.forEach(this._headers, function(col, i) {
        if (this._fieldMap.hasOwnProperty(col)) {
          setField(col, sourceData[i]);
        }
      }, this);
    }
    
    return obj;
  };

  /*
   * Use the schema defined in the dataset to build a set of updates.
   */
  var transformToSchemaUpsert = function(sourceData) {
    var self = this;
    var obj = {
      __update: []
    };

    var setField = function(field, data) {
      var sanitised = helpers.utils.sanitiseData(self._fieldMap[field].type, data);
      // If the target is part of the primary key add it as a property.
      if (self._config.primaryKey.indexOf(field) >= 0) {
        helpers.utils.setData(obj, field, sanitised, self._fieldMap[field].isArray);
      } else {
        // Do upsert of value.
        var update = {
          m: "r",             // replace
          p: field,
          v: sanitised
        };
        obj.__update.push(update);
      }
    };
    
    if (this._config.schemaMapping) {
      // Use the configured schema mapping to copy data from the source data.
      _.forEach(this._headers, function(col, i) {
        if (this._config.schemaMapping.hasOwnProperty(col)) {
          var target = this._config.schemaMapping[col];
          if (target.length > 0) {
            // Dataset field target is defined in the configuration.
            setField(this._config.schemaMapping[col], sourceData[i]);
          } else {
            // Dataset field target is blank => skip this column.
          }
        } else {
          // No target defined => use header column.
          setField(col, sourceData[i]);
        }
      }, this);
    } else {
      // No explicit schema mapping => use data schema.
      _.forEach(this._headers, function(col, i) {
        if (this._fieldMap.hasOwnProperty(col)) {
          setField(col, sourceData[i]);
        }
      }, this);
    }
    return obj;
  };

  var flushBulkQueue = function(cb) {
    var self = this;
    // Attempt to add the data to the dataset.
    if (self._bulkQueue.length > 0) {
      var bulkLoad = self._config.upsertMode ? helpers.commands.upsertDatasetDataBulk : helpers.commands.addDatasetDataBulk;
      bulkLoad(self._config.commandHost, self._accessToken, self._config.targetDataset, self._bulkQueue, function(err) {
        if (err) {
          // Review - failed to add items, continue with other items or abort?
          log("failed to write line %d [%s]", self._bulkQueue.length, err.message);
          self._failedCount += self._bulkQueue.length;
        } else {
          debug("added data %d", self._bulkQueue.length);
          self._addedCount += self._bulkQueue.length;
        }
        self._bulkQueue = [];
        cb(err);
      });
    }
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

      var isEmpty = data.join("").length === 0;
      if (!isEmpty && self._processCount > self._config.startLine) {
        // Transform to dataset schema.
        var persist;
        if (self._config.upsertMode) {
          persist = transformToSchemaUpsert.call(self, data);
        } else {
          persist = transformToSchema.call(self, data);
        }

        self._bulkQueue.push(persist);
        debug("bulk queue length %d",self._bulkQueue.length);

        if (self._bulkQueue.length > self._config.bulkCount) {
          flushBulkQueue.call(self, function(err) {
            setImmediate(function() { processQueue.call(self, cb); });
          });
        } else {
          setImmediate(function() { processQueue.call(self, cb); });
        }
      } else {
        if (self._processCount === 1) {
          // First line => get header values.
          self._headers = data;
        }
        // Skip to the next queue item.
        setImmediate(function() { processQueue.call(self, cb); });
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
      debug("starting queue [%d]", self._queue.length);
      self._queueRunning = true;
      processQueue.call(self, function() {
        debug("queue emptied");
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
      csvParse(fileContents.toString(), self._parserOptions, function(err, data) {
        if (err) {
          // Problem in parser.
          return cb(err);
        }
        debug("got %d lines of data",data.length);

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
    var parser = csvParse(self._parserOptions);

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

    var gotFile = function(filePath) {
      // Continue based on the configured processing mode.
      if (self._config.processingMode === "local") {
        processLocalFile.call(self, filePath, function(err) { checkFinished.call(self, err, cb); });
      } else {
        processLocalStream.call(self, filePath, function(err) { checkFinished.call(self, err, cb); });
      }
    };

    if (self._config.sourceUrl) {
      // Create a temporary file for downloading.
      self._downloadTarget = path.join("./", "download", "i-" + Date.now() + ".csv");

      // Attempt to download the file.
      log("starting download of %s to %s",self._config.sourceUrl,self._downloadTarget);
      helpers.download.downloadFile(self._config.sourceUrl, self._downloadTarget, function(err) {
        if (err) {
          log("download failed: %s",err.message);
          removeDownloadFile.call(self);
          cb(err);
        } else {
          log("downloaded file %s", self._config.sourceUrl);
          gotFile(self._downloadTarget);
        }
      });
    } else {
      gotFile(self._config.sourceFile);
    }
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
    var self = this;
    if (err) {
      // An error has occurred => delete any downloaded file and abort.
      removeDownloadFile.call(this);
      cb(err);
    }
    if (this._parseDone && this._queueRunning === false) {
      flushBulkQueue.call(this, function(err) {
        // Parsing has finished and the queue is empty => all done.
        removeDownloadFile.call(self);
        log("parsed %d items, %d failures",self._addedCount, self._failedCount);
        cb(err);
      });
    }
  };

  return Importer;
}());