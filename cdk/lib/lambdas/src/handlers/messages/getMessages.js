"use strict";
const logger = require("../../modules/logger");
const apiResponse = require("../../utils/apiResponses");
const MessageRepository = require("../../data/repositories/MessageRepository");
const BucketS3Context = require("../../data/contexts/BucketS3Context");
const config = require("../../config.json");

module.exports.handler = async (event) => {
  try {
    console.log(event);
    logger.info("Getting messages history...");

    const messageRepository = new MessageRepository(new BucketS3Context());

    const bucketName = config.aws.bucketName;
    const prefix = "message";
    const startAfter = `${prefix}, ${event.queryStringParameters.sinceDate}`;
    const maxKey = parseInt(event.queryStringParameters.quantity);

    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      StartAfter: startAfter,
      MaxKeys: maxKey,
    };
    let msgs = await messageRepository.find(params);
    msgs = msgs.reverse();
    const response = {
      messages: msgs,
    };

    logger.info(`messages: ${JSON.stringify(msgs)}`);
    return apiResponse.Ok(response);
  } catch (error) {
    logger.error(error);

    return apiResponse.InternalServerError(JSON.stringify(error));
  }
};
