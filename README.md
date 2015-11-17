#introduction
Generic importer for importing CSV files into nqm datasets.

##install

```
npm install -g nqm-csv-import
```

Use sudo if you get EACCESS errors.

##basic usage

```
DEBUG=log nqm-csv-import --credentials <tokenId:secret> --sourceFile tests/tempPerTru.csv
```

Basic import of new dataset where the schema is inferred from the source CSV and no primary key is defined. The dataset will be created using a name based on the source file. Having no primary key means that it is not possible to update the data and all data will be appended to the dataset.

```
DEBUG=log nqm-csv-import --credentials <tokenId:secret> --sourceFile tests/tempAlevels.csv --primaryKey ecode,year
```

Import new dataset specifying a primary key. Subsequent updates are possible. The dataset will be created using a name based on the source file.   

```
DEBUG=log nqm-csv-import --credentials <tokenId:secret> --sourceFile tests/tempAlevels.csv --primaryKey ecode,year --targetDataset 4ybvaLm2zx
```

Import data to an existing dataset. As a primary key is given "upsert" operations will be performed.

##advanced usage

It is possible to define the import parameters using a configuration file instead of via the command-line. When using this approach it is possible to specify mappings from the source data to the target dataset schema. 

The configuration file will vary depending on the type of data, but at a minimum it will contain details of the data source, the target dataset and the schema mappings. There are example CSV configuration files in the repo.

```
{
  /*
   * The URI of the hub command api.
   */
  "commandHost": "http://cmd.nqminds.com",

  /*
   * Access token credentials - get this from the toolbox.
   */
  "credentials": "<tokenId:secret>",

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
  "primaryKey": ["code"],

  /*
   * The schemaMapping is a dictionary mapping the CSV headings to target schema field.
   * If a CSV header column is defined in the schema the data will be copied to the named field in the dataset.
   * If a CSV header column is defined as blank in the schema, the column will be skipped.
   * If there is no entry for a given CSV heading, the data will be copied to a field with the name of the heading.
   */
  "schemaMapping": {
    "ecode": "code",  // Copy from the "ecode" CSV column to the "code" field.
    "name": "",       // Skip this column (don't copy any data).
    /*
    "year": "year",   // Copy from "year" to "year" - not necessary as this is the default behaviour.
    "value": "value"  // Copy from "value" to "value" - not necessary as this is the default behaviour.
    */
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

##running with a config file
Pass the name of the configuration as an argument to the script.

```
DEBUG=log nqm-csv-import --config truancy-config.js
```

To get debug/diagnostic information switch on full logging:

```
DEBUG=* nqm-csv-import --config trunacy-config.js
```

##build
Clone this repository then:

```
cd nqm-csv-import
npm install
```

###ToDo
- When updating use targetDataset to get dataset schema and primary key
- Error recovery. Need to decide on a strategy, and ideally make it configurable. Currently if a single row fails (usually due to validation problems) it **doesn't** fail the entire import.
- Tests. Need to write some.
- Schema changes. This is a hub issue rather than importing, but if the schema of the target dataset is changed and there is existing data the results are undefined.

