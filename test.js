module.exports={
commandHost: "http://cmd.nqminds.com",
targetDataset: {
id: "dataset-ProO3d",
scheme: {
value: "String",
name: "String",
ons: "String"
}
},
schemaMapping: [
{target:"ons"},
{},
{target:"name"},
{target:"value"}
],
sourceFile: "/home/toby/Downloads/formatted_truancyd.csv",
processingMode: "localStream",
delimiter: ",",
encoding: "utf8",
startLine: 1,
endLine: -1,
throttleRate: 30000,
bulkMode: true
}
