const DynamoDB = require("aws-sdk/clients/dynamodb");
const dynamodb = require("@aws-cdk/aws-dynamodb");

const tableExists = (tableName) => {
  return new Promise((resolve, reject) => {
    var dynamodb = new DynamoDB({ apiVersion: "2012-08-10" });
    dynamodb.describeTable({ TableName: tableName }, function (err, data) {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const createTable = async (stack, table) => {
  if (!(await tableExists(table.tableName))) {
    const TABLE = new dynamodb.Table(stack, table.tableName, {
      tableName: table.tableName,
      partitionKey: {
        name: table.partitionKeyName,
        type: table.partitionKeyType,
      },
      sortKey: { name: table.sortKeyName, type: table.sortKeyType },
    });
    if (table.globalSecondary && table.globalSecondary.length > 0) {
      table.globalSecondary.forEach((gsi) => {
        const gsiTable = {
          indexName: gsi.indexName,
          partitionKey: {
            name: gsi.partitionKeyName,
            type: gsi.partitionKeyType,
          },
        };
        if (gsi.sortKeyName) {
          gsiTable.sortKey = {
            name: gsi.sortKeyName,
            type: gsi.sortKeyType,
          };
        }
        console.log("globalSecondary", JSON.stringify(gsiTable));
        TABLE.addGlobalSecondaryIndex(gsiTable);
      });
    }
  }
};

module.exports = {
  createTable,
};
