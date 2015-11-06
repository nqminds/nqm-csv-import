
"use strict";

module.exports = {
  bulkMode: true,
  bulkCount: 100,
  throttleRate: 10000,
  upsertMode: false,
  
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://localhost:3103",
//  "commandHost": "http://cmd.nqminds.com",
  
  /*
   * Access token credentials
   */
  "credentials": "VJleEe7EMl:password",
  
  /*
   * The target dataset in the hub.
   *
  "targetDataset": {
    "id": "4kWXexXEfe",
    "scheme": {
      "District": { type: "String" },
      "LSOA": { type: "String" },
      "Year": "Number",
      "Gender": { type: "String"},
      "Age": { type: "String"},
      "Value": "Number",
      "Production Date": { type: "Number" }
    },
  },
*/
  "primaryKey": [],
  
  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the named field in the dataset.
   * If there is no target property that column will be ignored.
   */
  "schemaMapping": {
    "District": "District",  // copy data from csv column 1 to the 'ons' field
    "LSOA": "LSOA",
    "Year": "Year",
    "Gender": "Gender",
    "Age": "Age",
    "Value": "Value",
    "Production Date": "Production Date"
  },
  
  /*
   * The location of the source file.
   */
  "sourceFile": "/home/toby/Downloads/tempHccPopForecasts.csv",
  
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
   * processed as data becomes available. Suitable for larger files.
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
