
"use strict";

module.exports = {
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://localhost:3102",

  /*
   * The target dataset in the hub.
   */
  "targetDataset": {
    "id": "ds001",
    "scheme": {
      "fields": [
        { "name": "accidentIndex", "storageType": "string", "key": true },
        { "name": "vehicleRef", "storageType": "number", "key": true },
        { "name": "vehicleType", "storageType": "number", "key": false },
        { "name": "towing", "storageType": "date", "key": false },
        { "name": "manoeuvre", "storageType": "date", "key": false },
        { "name": "restrictedLane", "storageType": "number", "key": false },
        { "name": "junction", "storageType": "number", "key": false },
        { "name": "skidding", "storageType": "number", "key": false },
        { "name": "objectIn", "storageType": "number", "key": false },
        { "name": "leavingRoad", "storageType": "number", "key": false },
        { "name": "objectOff", "storageType": "number", "key": false },
        { "name": "firstImpact", "storageType": "number", "key": false },
        { "name": "lhd", "storageType": "number", "key": false },
        { "name": "journeyPurpose", "storageType": "number", "key": false },
        { "name": "sex", "storageType": "number", "key": false },
        { "name": "ageBand", "storageType": "number", "key": false },
        { "name": "engineCC", "storageType": "number", "key": false },
        { "name": "propulsion", "storageType": "number", "key": false },
        { "name": "vehicleAge", "storageType": "number", "key": false },
        { "name": "driverDecile", "storageType": "number", "key": false },
        { "name": "driverHomeArea", "storageType": "number", "key": false }
      ]
    }
  },

  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the named field in the dataset.
   * If there is no target property that column will be ignored.
   *
   * If there is no schemaMapping or the array is empty, the data will be copied to the field with the corresponding
   * index in the dataset schema.
   */
  "schemaMapping": [
  ],

  /*
   * The location of the source file.
   */
  "sourceUrl": "http://two268.com/nqm/Vehicles0513.csv",

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
   * Specifies how to throttle the input stream so that the parser doesn't get overwhelmed.
   * Use this to
   * Value is bytes/second.
   */
  "throttleRate": 750
};
