"use strict";

const AWS = require("aws-sdk");
const logger = require("../../modules/logger");
const config = require("../../config.json");

class DynamoDbContext {
  constructor() {
    AWS.config.region = config.aws.region;
    this.dynamoDB = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region: config.aws.region,
    });
  }

  create(item, tableName) {
    const params = {
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(id)",
    };

    logger.info(`params: ${JSON.stringify(params)}`);

    return this.dynamoDB.putItem(params).promise();
  }
  update(item, updateExpression, expressionAttributeValues, tableName) {
    logger.info(`item: ${JSON.stringify(item)}`);
    const params = {
      TableName: tableName,
      Key: { id: item.pk, sort: item.sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    logger.info(`params: ${JSON.stringify(params)}`);
    return this.dynamoDB.updateItem(params).promise();
  }
  delete(id, tableName) {
    const params = {
      TableName: tableName,
      Key: { id: { S: id } },
      ReturnValues: "ALL_OLD",
    };

    logger.info(`params: ${JSON.stringify(params)}`);
    return this.dynamoDB.deleteItem(params).promise();
  }
  find(key, tableName) {
    const params = {
      TableName: tableName,
      Key: key,
    };

    logger.info(`params: ${JSON.stringify(params)}`);

    return this.dynamoDB.getItem(params).promise();
  }
  findQuery(id, tableName, filter) {
    const params = {
      TableName: tableName,
      ExpressionAttributeValues: {
        ":idValue": {
          S: id,
        },
      },
      KeyConditionExpression: "id = :idValue",
    };

    logger.info(`params: ${JSON.stringify(params)}`);

    return this.dynamoDB.query(params).promise();
  }
  findCustomQuery(tableName, expression, keyCondition, filterExpression, asc) {
    const params = {
      TableName: tableName,
      ExpressionAttributeValues: expression,
      KeyConditionExpression: keyCondition,
      ScanIndexForward: asc,
    };
    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    logger.info(`params: ${JSON.stringify(params)}`);

    return this.dynamoDB.query(params).promise();
  }
  last(id, tableName, limit, groupId) {
    const params = {
      TableName: tableName,
      ExpressionAttributeValues: {
        ":value": {
          S: id,
        },
      },
      KeyConditionExpression: "id = :value",
      ScanIndexForward: false,
      Limit: limit,
    };
    if (groupId.substring(6, 9) !== "all") {
      params.IndexName = "groupId-index";
      params.ExpressionAttributeValues = {
        ":value": {
          S: groupId,
        }, //group# + #userId#
      };
      params.KeyConditionExpression = `groupId = :value`;
    }
    console.log(`params: ${JSON.stringify(params)}`);
    return this.dynamoDB.query(params).promise();
  }
  all(tableName) {
    const params = {
      TableName: tableName,
    };

    logger.info(`params: ${JSON.stringify(params)}`);

    return this.dynamoDB.scan(params).promise();
  }
  allByGlobalSecondaryIndex(id, tableName, globalField, asc) {
    const params = {
      TableName: tableName,
      IndexName: `${globalField}-index`,
      ExpressionAttributeValues: {
        ":idValue": {
          S: id,
        },
      },
      KeyConditionExpression: `${globalField} = :idValue`,
      ScanIndexForward: asc,
    };

    logger.info(`params: ${JSON.stringify(params)}`);
    const result = this.dynamoDB.query(params).promise();

    return result;
  }
  scan(tableName, stk) {
    const params = {
      TableName: tableName,
      FilterExpression: stk.filterExpression,
      ExpressionAttributeValues: stk.expressionAttributeValues,
      // AttributesToGet: stk.attributesToGet,
    };
    if (stk.expressionAttributeNames) {
      // params.ProjectionExpression = stk.projectionExpression;
      params.ExpressionAttributeNames = stk.expressionAttributeNames;
    }
    const result = this.dynamoDB.scan(params).promise();
    return result;
  }
}

module.exports = DynamoDbContext;
