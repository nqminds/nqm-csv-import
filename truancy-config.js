
"use strict";

module.exports = {
  bulkMode: true,
  upsertMode: true,

  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://localhost:3103",
//  "commandHost": "http://cmd.nqminds.com",

  /*
   * Access token credentials
   */
  "credentials": "<tokenId:secret>",
  
  /*
   * The schema of the target dataset.
   */
  "schema": {
    "code": "String",
    "year": "String",
    "value": "Number"
  },
  
  /*
   * The fields that form the primary key.
   */
  "primaryKey": ["code"],

  /*
   * The schemaMapping is a dictionary mapping the CSV headings to target schema field.
   * If a CSV header column is defined in the schema the data will be copied to the named field in the dataset.
   * If a CSV header column is defined as blank in the schema, the column will be skipped.
   * If there is no entry for a given CSV heading, the data will be copied to a field with the name of the heading.
   */
  "schemaMapping": { 
    "ecode": "code",  // Copy from the "ecode" CSV column to the "code" field.
    "name": "",       // Skip this column (don't copy any data).
    /*
    "year": "year",   // Copy from "year" to "year" - not necessary as this is the default behaviour.
    "value": "value"  // Copy from "value" to "value" - not necessary as this is the default behaviour.
    */
  },

  /*
   * The location of the source file.
   */
  "sourceFile": "/home/toby/Downloads/tempPerTru.csv",

  /*
   * The processing mode - need to experiment with which is more performant,
   * but there may be some cases where it's desirable to download the file and
   * store it locally before processing.
   *
   * Possible values are:
   *
   * local => file is downloaded and then the entire contents are read into
   * memory at once, parsed and then processed. Probably the fastest but not
   * suitable for larger files.
   *
   * localStream => file is downloaded and then streamed into the parser and
   * processed as data becomes available. Suitable for larger files (default).
   *
   * remoteStream => file is not downloaded but streamed directly from the
   * remote url into the parser and processed as data becomes available.
   */
  "processingMode": "localStream",

  /*
   * The delimiter used in the source file.
   */
  "delimiter": ",",

  /*
   * Expected encoding of source data.
   */
  "encoding": "utf8",

  /*
   * The line at which processing is to start.
   */
  "startLine": 1,

  /*
   * The line at which processing is to stop.
   * Specify -1 for the entire file.
   */
  "endLine": -1
};
