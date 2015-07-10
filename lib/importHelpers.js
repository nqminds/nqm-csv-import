/**
 * Created by toby on 29/06/15.
 */

(function(exports) {
  "use strict";

  var util = require("util");
  var request = require("request");
  var fs = require("fs");

  /*
   * Helper to download a file from a URL to a local file.
   */
  exports.downloadFile = (function() {
    var log = require("debug")("downloadFile");

    function download(url, target, encoding, cb) {
      // Encoding defaults to utf8.
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = "utf8";
      }
      request(url, function (err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error("not found");
          log("failure downloading from %s [%s]", url, err.message);
          cb(err);
        } else {
          fs.writeFile(target, content, { encoding: encoding }, cb);
        }
      });
    }

    return download;
  }());

  /*
   * Helper to get a dataset using the nqmHub query api.
   */
  exports.getDataset = (function() {
    var log = require("debug")("getDataset");

    function getDS(queryHost, datasetId, cb) {
      var url = util.format("%s/datasets/%s", queryHost, datasetId);
      request({ method: "get", url: url, json: true }, function(err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error("not found");
          log("failure getting dataset %s [%s]",datasetId, err.message);
          cb(err);
        } else {
          cb(null, content);
        }
      });
    }

    return getDS;
  }());

  /*
   * Helper to add data to a dataset using the nqmHub command api.
   */
  exports.addDatasetData = (function() {
    var log = require("debug")("addDatasetData");

    function addData(commandHost, datasetId, data, cb) {
      var url = util.format("%s/command/dataset/data/create", commandHost);
      data.datasetId = datasetId;
      request({ url: url, method: "post",  json: true, body: data }, function(err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error(response.body.error || "not found");
          log("failure adding dataset data [%s]", err.message);
          cb(err);
        } else {
          cb(null);
        }
      });
    }

    return addData;
  }());

  /*
   * Helper to add data to a dataset using the nqmHub command api.
   */
  exports.addDatasetDataBulk = (function() {
    var log = require("debug")("addDatasetDataBulk");

    function addDataBulk(commandHost, datasetId, data, cb) {
      var url = util.format("%s/command/dataset/data/createMany", commandHost);
      var bulk = {};
      bulk.datasetId = datasetId;
      bulk.payload = data;
      log("sending createMany [%d]",data.length);
      request({ url: url, method: "post",  json: true, body: bulk }, function(err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error(response.body.error || "not found");
          log("failure adding dataset data [%s]", err.message);
          cb(err);
        } else {
          log("result from server: %j", response.body);
          cb(null);
        }
      });
    }

    return addDataBulk;
  }());

  /*
   * Helper to upsert data to a dataset using the nqmHub command api.
   */
  exports.upsertDatasetData = (function() {
    var log = require("debug")("upsertDatasetData");

    function upsertData(commandHost, datasetId, data, cb) {
      var url = util.format("%s/command/dataset/data/upsert", commandHost);
      data.datasetId = datasetId;
      request({ url: url, method: "post",  json: true, body: data }, function(err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error(response.body.error || "not found");
          log("failure upserting dataset data [%s]", err.message);
          cb(err);
        } else {
          cb(null);
        }
      });
    }

    return upsertData;
  }());

  /*
   * Helper to upsert data to a dataset using the nqmHub command api.
   */
  exports.upsertDatasetDataBulk = (function() {
    var log = require("debug")("upsertDatasetDataBulk");

    function upsertDataBulk(commandHost, datasetId, data, cb) {
      var url = util.format("%s/command/dataset/data/upsertMany", commandHost);
      var bulk = {};
      bulk.datasetId = datasetId;
      bulk.payload = data;
      log("sending upsertMany [%d]",data.length);
      request({ url: url, method: "post",  json: true, body: bulk }, function(err, response, content) {
        if (err || response.statusCode !== 200) {
          err = err || new Error(response.body.error || "not found");
          log("failure upserting dataset data [%s]", err.message);
          cb(err);
        } else {
          log("result from server: %j", response.body);
          cb(null);
        }
      });
    }

    return upsertDataBulk;
  }());

}(module.exports));

