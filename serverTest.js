
"use strict";

module.exports = {
  "commandHost":"http://cmd.nqminds.com",
  "targetDataset":  {
    "id":"dataset-zuXAzq",
    "scheme" :
    {
      "value" :"Number",
      "name": "String",
      "ons" : "String"
    }
  },
  "schemaMapping" :  [
    {"target":"ons"},
    {},
    {"target":"name"},
    {"target":"value"}
  ],
  "sourceUrl" : "http://two268.com/nqm/formatted_truancy.csv",
  "processingMode" :  "localStream",
  "delimiter":  ",",
  "encoding":  "utf8",
  "startLine" : 1,
  "endLine":  -1,
  "throttleRate":  30000,
  "bulkMode":  true
};
