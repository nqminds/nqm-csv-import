
"use strict";

module.exports = {
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://localhost:3102",

  /*
   * The URI of the hub query api.
   */
  "queryHost": "http://localhost:3104/v1",

  /*
   * The id of the target dataset in the hub.
   */
  "targetDataset": "ds001",

  /*
   * The location of the source file.
   */
  "sourceUrl": "http://two268.com/nqm/tfl-journeys.csv",

  /*
   * The processing mode - need to experiment with which is more performant, but there may be some cases
   * where it's desirable to download the file and store it locally before processing.
   * Possible values are:
   *
   * local => file is downloaded and then the entire contents are read into memory at once, parsed and then processed.
   * Probably the fastest but not suitable for larger files.
   *
   * localStream => file is downloaded and then streamed into the parser and processed as data becomes available.
   * Suitable for larger files.
   *
   * remoteStream => file is not downloaded but streamed directly from the remote url into the parser and processed
   * as data becomes available.
   */
  "processingMode": "remoteStream",

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
  "endLine": -1,

  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the corresponding field in the dataset.
   * If the target is 'false' it will be ignore.
   */
  "schemaMapping": [
  ]
};
