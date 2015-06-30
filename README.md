#introduction
Generic importer for importing CSV files into nqm datasets.

This component is only concerned with the mechanics of importing data. It is self-contained and completely de-coupled from the process of configuring what data will be imported.

The idea is that a user will initiate the import through a separate component. This will probably be via a web interface of some kind that will allow the user to indicate the source data URL (or upload file etc), and specify mappings from the source data to the target dataset. The outcome of this first step will be a new dataset created in the hub with the appropriate schema and an import configuration file. The configuration file will vary depending on the type of data, but at a minimum it will contain details of the data source, the target dataset and the schema mappings. There are example CSV configuration files in the repo.

The next step is to provision an instance of the importer with the configuration file. The importer will most likely be running on a remote server. One possibility is that several importers will be running and 'listening' for configuration commands from the hub. 

When the importer starts it can run in one of three modes. This is currently configured in the config file but it could be chosen dynamically. It may eventually transpire that only one of the modes makes sense for all cases:

 1. local - file is downloaded and then the entire contents are read into memory at once and processed. Fast but only suitable for small imports.
 2. localStream - similar to 1, the file is downloaded but instead of loading the entire file into memory a readable stream is created and piped into the parser. This is probably the most common mode.
 3. remoteStream - the file is not downloaded but streamed directly from the remote source and piped into the parser. Suitable if network connectivity is reliable.

When running in a streaming mode, the input stream is throttled so that it doesn't overwhelm the parser. This makes it possible to process very large files as the processing is not limited to the available RAM. The throttle rate is currently configured in the config file, but again this could be made dynamic (nice project for an intern?).

The configuration file allows specification of a start and end point in the source file. This enables horizontal scaling, for example if 10 importers are attached to a hub it could instruct each importer to process a tenth of the data. The efficiency would depend on where the bottlenecks are I suppose.

The CSV importer has been tested with several sample files. Performance is on the low side (see bulk inserts below), but acceptable. Files with 1000s of lines are imported in minutes. One of the samples is a 170Mb CSV file containing details of all vehicles involved in traffic accidents from 2005-2012, with almost 1M lines of data. I estimate this would take approximately 3 days to import (mainly due to throttling rate of 750 bytes per second), but once the import process starts the incoming data is available in the hub, and you can watch it arriving. Enabling bulk updates would probably improve this considerably.

###ToDo
- Bulk inserts. Currently each data row is added via an HTTP POST. This could easily be changed to update a batch of rows at a time and thereby decrease the HTTP overhead.
- Updates. Currently rows are only added to the target dataset. This could easily be made to upsert.
- Error recovery. Need to decide on a strategy, and ideally make it configurable. Currently if a single row fails (usually due to validation problems) it **doesn't** fail the entire import.
- Tests. Need to write some.
- Schema changes. This is a hub issue rather than importing, but if the schema of the target dataset is changed and there is existing data the results are undefined!

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