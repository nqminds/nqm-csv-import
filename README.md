#introduction
Generic importer for importing CSV files into nqm datasets.

##basic usage

Basic import of new dataset where the schema is inferred from the source CSV and no primary key is defined. The dataset will be created using a name based on the source file. Having no primary key means that it is not possible to update the data and all data will be appended to the dataset.

```
node nqmCSVImport --credentials 4kClAjSzg:password --sourceFile tests/tempPerTru.csv 
```

Import new dataset specifying a primary key. Subsequent updates are possible. The dataset will be created using a name based on the source file.   

```
node nqmCSVImport --credentials 4kClAjSzg:password --sourceFile tests/tempAlevels.csv --primaryKey ecode,year
```

Import data to an existing dataset. As a primary key is given "upsert" operations will be performed.

```
node nqmCSVImport --credentials 4kClAjSzg:password --sourceFile tests/tempAlevels.csv --primaryKey ecode,year --targetDataset 4ybvaLm2zx
```

##advanced usage

It is possible to define the import parameters using a configuration file instead of via the command-line. When using this approach it is possible to specify mappings from the source data to the target dataset schema. 

The configuration file will vary depending on the type of data, but at a minimum it will contain details of the data source, the target dataset and the schema mappings. There are example CSV configuration files in the repo.

When the importer starts it can run in one of three modes. This is currently configured in the config file but it could be chosen dynamically. It may eventually transpire that only one of the modes makes sense for all cases:

 1. local - file is downloaded and then the entire contents are read into memory at once and processed. Fast but only suitable for small imports.
 2. localStream - (default) similar to 1, the file is downloaded but instead of loading the entire file into memory a readable stream is created and piped into the parser. This is probably the most common mode.
 3. remoteStream - the file is not downloaded but streamed directly from the remote source and piped into the parser. Suitable if network connectivity is reliable.

When running in a streaming mode, the input stream is throttled so that it doesn't overwhelm the parser. This makes it possible to process very large files as the processing is not limited to the available RAM. The throttle rate is currently configured in the config file, but again this could be made dynamic (nice project for an intern?).

The configuration file allows specification of a start and end point in the source file. This enables horizontal scaling, for example if 10 importers are attached to a hub it could instruct each importer to process a tenth of the data. The efficiency would depend on where the bottlenecks are I suppose.

It is possible to generate this file manually but ultimately it will be generated programmatically with possible input from a user.

If generating it manually you will need to configure the correct ```commandHost``` and ```targetDataset``` properties and define the ```schemaMapping``` if necessary.

```
{
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://cmd.nqminds.com",

  /*
   * Access token credentials - get this from the toolbox.
   */
  "credentials": "3dClAjSzg:password",

  /*
   * The target dataset in the hub.
   */
  "targetDataset": "",
  
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
  "primaryKey": ["ons"],

  /*
   * The schemaMapping is a dictionary mapping the CSV headings to target schema field.
   * If a CSV header column is defined in the schema the data will be copied to the named field in the dataset.
   * If a CSV header column is defined as blank in the schema, the column will be skipped.
   * If there is no entry for a given CSV heading, the data will be copied to a field with the name of the heading.
   */
  "schemaMapping": {
    { "target": "ons" },  // copy data from csv column 1 to the 'ons' field
    {},                   // ignore data in column 2
    { "target": "area"},  // copy data from csv column 3 to the 'area' field
    { "target": "value"}  // copy data from csv column 4 to the 'value' field
  },

  /*
   * The location of the source file.
   */
  "sourceFile": "tests/tempPerTru.csv",

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
node nqmCSVImport --config truancy-config.js
```

To get debug/diagnostic information switch on logging:

```
DEBUG=* node nqmCSVImport --config trunacy-config.js
```

##installation
Clone this repository then:

```
cd nqmCSVImporter
npm install
```

###ToDo
- When updating use targetDataset to get dataset schema and primary key
- Error recovery. Need to decide on a strategy, and ideally make it configurable. Currently if a single row fails (usually due to validation problems) it **doesn't** fail the entire import.
- Tests. Need to write some.
- Schema changes. This is a hub issue rather than importing, but if the schema of the target dataset is changed and there is existing data the results are undefined.

