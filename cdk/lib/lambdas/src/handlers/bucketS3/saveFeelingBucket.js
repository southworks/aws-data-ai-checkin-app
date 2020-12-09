"use strict";
const s3Service = require("./S3Service");
const logger = require("../../modules/logger");
const MessageRepository = require("../../data/repositories/MessageRepository");
const BucketS3Context = require("../../data/contexts/BucketS3Context");
const config = require("../../config.json");

const nameData = (date) => `message, ${date}`;

const resultIsNeutral = (feelingResult) => {
  console.log("saveFeelingBucket.resultIsNeutral? ", feelingResult);
  return feelingResult === "NEUTRAL" || feelingResult === "MIXED";
};

const saveNeutralFeeling = async (params) => {
  console.log(
    "saveFeelingBucket.saveNeutralFeeling. Feeling is neutral saving into neutrals Bucket S3...",
    params
  );
  return await s3Service.updateData(params);
};

exports.handler = async (event) => {
  console.log("saveFeelingBucket: ", event);
  const body = JSON.stringify(event);
  const key = nameData(new Date().toISOString());
  const bucketParams = {
    key,
    body,
  };
  logger.info(
    `Start comproving if is neutral to be stored on neutrals Bucket S3...`
  );

  if (resultIsNeutral(event.lexResult.Payload.intentName)) {
    bucketParams.name = config.aws.neutralsBucketName;

    return await saveNeutralFeeling(bucketParams);
  } else {
    bucketParams.name = config.aws.bucketName;

    logger.info(`Start save to Bucket...: ${config.aws.bucketName}`);

    return await s3Service.updateData(bucketParams);
  }
};
