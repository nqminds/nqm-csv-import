
"use strict";

module.exports = {
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://localhost:3103",
  
  "credentials": "4kClAjSzg:password",
  
  inferSchema: true,
  
  /*
   * Schema of the target dataset in the hub.
  "schema": {
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
  },
   */
  
  /*
   * The location of the source file.
   */
  "sourceFile": "/home/toby/Downloads/tfl-journeys.csv",
};
