"use strict";
const logger = require("../../modules/logger");
const apiResponse = require("../../utils/apiResponses");
const s3Service = require("../bucketS3/S3Service");
const MessageRepository = require("../../data/repositories/MessageRepository");
const BucketS3Context = require("../../data/contexts/BucketS3Context");
const config = require("../../config.json");

module.exports.handler = async (event) => {
  try {
    console.log(event);
    logger.info("Training BOT...");
    logger.info(`params: ${event.body}`);
    const body = JSON.parse(event.body);
    const params = body.messages;
    const messageRepository = new MessageRepository(new BucketS3Context());

    const msgs = await messageRepository.rateMessages(params);

    const param = {
      Bucket: config.aws.bucketName,
      Delete: {
        Objects: msgs.messageToDelete,
      },
    };
    const resp = await s3Service.deleteDatas(param);
    logger.info(`messages deleted: ${JSON.stringify(resp)}`);

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
