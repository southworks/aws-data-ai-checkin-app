"use strict";
const logger = require("../../modules/logger");

const FeelingRepository = require("../../data/repositories/FeelingRepository");
const DynamoDbContext = require("../../data/contexts/DynamoDbContext");

module.exports.handler = async (event) => {
  logger.info("Getting feeling participant history...");
  logger.info(`event: ${JSON.stringify(event)}`);

  const feeling = {
    id: event.id,
    dateTime: Date.now().toString(),
    audioUrl: event.audioUrl,
    intentName: event.lexResult.Payload.intentName,
    inputText: event.inputText,
    recognizedBy: event.recognizedBy,
    userId: event.userId,
    s3Path: event.saveResponse.Payload.Location,
  };

  const feelingRepository = new FeelingRepository(new DynamoDbContext());
  await feelingRepository.create(feeling);
};
