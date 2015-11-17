/**
 * Created by toby on 05/11/15.
 */

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
  
  /*
   * Access token credentials
   */
  "credentials": "<tokenId:secret>",
  
  /*
   * The target dataset in the hub.
  "targetDataset": {
    "id": "dataset-QpMRrY",
    "scheme": {
      "period": "String",
      "reportingPeriod": "Number",
      "daysInPeriod": "Number",
      "periodBegin": "Date",
      "periodEnds": "Date",
      "bus": "Number",
      "underground": "Number",
      "dlr": "Number",
      "tram": "Number",
      "overground": "Number",
      "emirates": "Number"
    }
  },
   */
  
  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the named field in the dataset.
   * If there is no target property that column will be ignored.
  "schemaMapping": [
    { target: "GP_PRACTICE" },
    { target: "reportingPeriod" },
    { target: "daysInPeriod" },
    { target: "periodBegin" },
    { target: "periodEnds" },
    { target: "bus" },
    { target: "underground" },
    { target: "dlr" },
    { target: "tram" },
    { target: "overground" },
    { target: "emirates" }
  ],
   */
  
  /*
   * The location of the source file.
   */
  "sourceFile": "/home/toby/Downloads/tempGpPatientsAge.csv",
  
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
  "processingMode": "localStream",
};
