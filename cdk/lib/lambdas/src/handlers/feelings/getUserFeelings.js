"use strict";
const logger = require("../../modules/logger");
const apiResponse = require("../../utils/apiResponses");

const FeelingRepository = require("../../data/repositories/FeelingRepository");
const DynamoDbContext = require("../../data/contexts/DynamoDbContext");

module.exports.handler = async (event) => {
  try {
    logger.info("Getting participant's feeling history...");

    if (!event || !event.pathParameters || !event.pathParameters.userId) {
      return apiResponse.BadRequest("The userId field is required");
    }

    const userId = event.pathParameters.userId;
    const feelingRepository = new FeelingRepository(new DynamoDbContext());
    const query = {
      filterExpression: "userId = :u",
      expressionAttributeValues: {
        ":u": {
          S: userId,
        },
      },
    };
    const feelings = await feelingRepository.scan(query);

    if (!feelings.length) {
      return apiResponse.NotFound(
        "There are no feelings reported by this user yet"
      );
    }

    logger.info(`Feelings: ${JSON.stringify(feelings)}`);

    return apiResponse.Ok(feelings);
  } catch (error) {
    logger.error(error);

    return apiResponse.InternalServerError(JSON.stringify(error));
  }
};
