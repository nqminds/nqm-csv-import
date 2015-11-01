
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
  "credentials": "EyERKqnWg:password",
  
  /*
   * The target dataset in the hub.
   */
  "targetDataset": {
    "id": "NyYCBc3We",
    "scheme": {
      "District": "String",
      "LSOA": "String",
      "Year": "Number",
      "Gender": "String",
      "Age": "String",
      "Value": "Number",
      "Production Date": "Number"
    },
    "uniqueIndex": []
  },
  
  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the named field in the dataset.
   * If there is no target property that column will be ignored.
   */
  "schemaMapping": [
    { "target": "District" },  // copy data from csv column 1 to the 'ons' field
    { "target": "LSOA" },
    { "target": "Year"},  // copy data from csv column 3 to the 'area' field
    { "target": "Gender"},
    { "target": "Age" },
    { "target": "Value" },
    { "target": "Production Date" },
  ],
  
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
  "processingMode": "local",
  
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
