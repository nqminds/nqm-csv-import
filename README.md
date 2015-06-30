#introduction
Generic importer for importing CSV files into nqm datasets.
##installation
Clone this repository then:
```
cd nqmCSVImporter
npm install
```
##configuration
The processing of the CSV file is configured via the config.js file in the project root and is described below.

It is possible to generate this file manually but ultimately it will be generated programmatically with possible input from a user.

If generating it manually you will need to configure the correct ```commandHost``` and ```targetDataset``` properties and define the ```schemaMapping``` if necessary.
```
{
  /*
   * The URI of the hub command api.
   */
  "commandHost": "https://hubapi.nqminds.com",

  /*
   * The target dataset in the hub.
   */
  "targetDataset": {
    "id": "ds001",
    "scheme": {
      "fields": [
        { "name": "ons", "storageType": "string", "key": true, "units": "onsGSS" },
        { "name": "value", "storageType": "number", "key": false, "units": "percent" },
        { "name": "area", "storageType": "string", "key": false }
      ]
    }
  },

  /*
   * Define how the CSV columns will map to the schema defined in the dataset.
   * The schemaMapping array will reflect the order of the columns in the CSV.
   * If a target is defined for a column the data will be copied to the named
   * field in the dataset.
   *
   * If there is no target property that column will be ignored.
   *
   * If there is no schemaMapping or the array is empty, the data will be
   * copied to the field with the corresponding index in the dataset schema.
   */
  "schemaMapping": [
    { "target": "ons" },  // copy data from csv column 1 to the 'ons' field
    {},                   // ignore data in column 2
    { "target": "area"},  // copy data from csv column 3 to the 'area' field
    { "target": "value"}  // copy data from csv column 4 to the 'value' field
  ],

  /*
   * The location of the source file.
   */
  "sourceUrl": "http://two268.com/nqm/formatted_truancy.csv",

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
  "endLine": -1
}
```
##running
Pass the name of the configuration as an argument to the script.
```
node index truancy-config.js
```
To get debug/diagnostic information switch on logging:
```
DEBUG* node index trunacy-config.js
```
