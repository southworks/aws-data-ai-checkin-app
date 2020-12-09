"use strict";

const AWS = require("aws-sdk");
const logger = require("../../modules/logger");
const config = require("../../config.json");
const lexmodelbuildingservice = new AWS.LexModelBuildingService();

class BucketS3Context {
  constructor() {
    AWS.config.accessKeyId = config.aws.accessKeyId;
    AWS.config.secretAccessKey = config.aws.secretAccessKey;
    AWS.config.region = config.aws.region;
    this.s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });
  }

  async getObject(params, key) {
    const param = {
      Bucket: params.Bucket,
      Key: key,
    };
    let response = {};
    const data = await this.s3.getObject(param).promise();
    response = data.Body.toString("utf-8");
    return response;
  }

  async find(params) {
    logger.info(`Findig object from BucketS3: ${JSON.stringify(params)}`);
    const resp = await this.s3.listObjectsV2(params).promise();

    const response = resp.Contents;
    await Promise.all(
      response.map(async (data) => {
        const key = data.Key;
        const d = await this.getObject(params, key);
        data.Object = JSON.parse(d);
      })
    );
    return resp;
  }

  async getIntent(name) {
    logger.info(`Get Intent: ${name}`);
    const params = {
      name: name,
      version: "$LATEST",
    };
    return await lexmodelbuildingservice
      .getIntent(params)
      .promise()
      .catch((err) => {
        console.log(err);
      });
  }

  async putIntent(params) {
    logger.info(`Put Intent: ${JSON.stringify(params)}`);
    const data = await lexmodelbuildingservice
      .putIntent(params)
      .promise()
      .catch((err) => {
        console.log(err);
      });
    logger.info(`Put Intent: ${JSON.stringify(data)}`);
  }

  containsUtterances(array, word) {
    const response = array.some((item) => {
      if (item === word) return true;
    });
    return response;
  }

  async addUtterance(intent, newMessages) {
    logger.info(`Added utterance to Intent: ${JSON.stringify(intent)}`);
    await Promise.all(
      newMessages.map(async (msg) => {
        const wordAlreadyExists = await this.containsUtterances(
          intent.sampleUtterances,
          msg
        );
        if (!wordAlreadyExists) {
          intent.sampleUtterances = [...intent.sampleUtterances, msg];
        }
      })
    );

    //intent.sampleUtterances = [...intent.sampleUtterances, ...newMessages];

    delete intent.lastUpdatedDate;
    delete intent.version;
    delete intent.createdDate;
    intent.createVersion = true;
    const data = await lexmodelbuildingservice
      .putIntent(intent)
      .promise()
      .catch((err) => {
        console.log(err);
      });
    logger.info(`After to added utteraces on Intent: ${JSON.stringify(data)}`);
  }

  async getLastVersionSlotType(intentName) {
    const param = {
      name:
        intentName === "Positive"
          ? "FEELINGSPositive"
          : intentName === "Negative"
          ? "FEELINGSNegative"
          : "FEELINGSNeutral" /* required */,
      maxResults: 40,
    };

    let versions = await lexmodelbuildingservice
      .getSlotTypeVersions(param)
      .promise()
      .catch((err) => {
        console.log(err);
      });

    logger.info(
      `versions of the slot type ${intentName} ${JSON.stringify(versions)}`
    );

    while (versions.nextToken) {
      param.nextToken = versions.nextToken;
      versions = await lexmodelbuildingservice
        .getSlotTypeVersions(param)
        .promise()
        .catch((err) => {
          console.log(err);
        });
    }

    logger.info("Finished");
    if (versions.slotTypes.length > 0) {
      const lastversion = versions.slotTypes[versions.slotTypes.length - 1];
      logger.info(`last version is ${lastversion.version}`);
      return `${lastversion.version}`;
    }
    return "$LATEST";
  }

  async getLastVersionIntent(intentName) {
    const param = {
      name: intentName /* required */,
      maxResults: 40,
    };

    let versions = await lexmodelbuildingservice
      .getIntentVersions(param)
      .promise()
      .catch((err) => {
        console.log(err);
      });

    while (versions.nextToken) {
      param.nextToken = versions.nextToken;
      versions = await lexmodelbuildingservice
        .getIntentVersions(param)
        .promise()
        .catch((err) => {
          console.log(err);
        });
    }

    logger.info("Finished find last version");
    if (versions.intents.length > 0) {
      const ultimo = versions.intents[versions.intents.length - 1];
      return `${ultimo.version}`;
    }
    return "$LATEST";
  }

  async addUtterances(intentWithUtterances, intentName) {
    logger.info(`Added utterances to Intent: ${intentName}`);
    const intent = await this.getIntent(intentName);
    intent.slots[0].slotTypeVersion = await this.getLastVersionSlotType(
      intentName
    );
    //intent.slots[0].slotTypeVersion = '$LATEST';
    await this.addUtterance(intent, intentWithUtterances.messages);
  }

  contains(array, word) {
    const response = array.some((item) => {
      if (item.value === word.value) return true;
    });
    return response;
  }

  async addWordToSlot(slot, words) {
    await Promise.all(
      words.map(async (word) => {
        const wordAlreadyExists = await this.contains(
          slot.enumerationValues,
          word
        );
        if (!wordAlreadyExists) {
          slot.enumerationValues = [...slot.enumerationValues, word];
        }
      })
    );
    delete slot.lastUpdatedDate;
    delete slot.createdDate;
    delete slot.version;
    slot.createVersion = true;
    logger.info(`Antes del put: ${JSON.stringify(slot)}`);
    const response = await lexmodelbuildingservice
      .putSlotType(slot)
      .promise()
      .catch((err) => {
        console.log(err);
      });
    return response;
  }

  async addToSlotType(Words, typeSlotName) {
    logger.info(`Added words to slot: ${typeSlotName}`);
    const params = {
      name: typeSlotName,
      version: "$LATEST",
    };
    const slot = await lexmodelbuildingservice
      .getSlotType(params)
      .promise()
      .catch((err) => {
        console.log(err);
      });
    logger.info(`Slot after add words: ${typeSlotName}`);
    const responseSlot = await this.addWordToSlot(slot, Words);
    responseSlot.slotConstraint = "Required";
    logger.info(`Slot after add words: ${JSON.stringify(responseSlot)}`);
    return responseSlot;
  }

  async buildBot() {
    logger.info(`Builing BOT`);
    const response = {
      message: "",
    };
    try {
      const bot = await lexmodelbuildingservice
        .getBot({ name: "FeelingTracker", versionOrAlias: "$LATEST" })
        .promise();
      logger.info(JSON.stringify(bot));
      const intents = [
        {
          intentName: "Negative",
          intentVersion: await this.getLastVersionIntent("Negative"),
        },
        {
          intentName: "Neutral",
          intentVersion: await this.getLastVersionIntent("Neutral"),
        },
        {
          intentName: "Mixed",
          intentVersion: await this.getLastVersionIntent("Mexed"),
        },
        {
          intentName: "Positive",
          intentVersion: await this.getLastVersionIntent("Positive"),
        },
      ];
      console.log(intents);
      bot.intents = intents;
      delete bot.status;
      delete bot.failureReason;
      delete bot.lastUpdatedDate;
      delete bot.createdDate;
      delete bot.version;
      bot.processBehavior = "BUILD";
      const re = await lexmodelbuildingservice.putBot(bot).promise();
      logger.info(JSON.stringify(re));

      while (re.status !== "BUILDING") {
        logger.info("REBUILD");
        const re2 = await lexmodelbuildingservice.putBot(bot).promise();
        logger.info(JSON.stringify(re2));
        const re = await lexmodelbuildingservice
          .getBot({ name: "FeelingTracker", versionOrAlias: "$LATEST" })
          .promise();
        logger.info(JSON.stringify(re));
      }
      response.message = "Messages were clasified successful";
      return response;
    } catch (err) {
      response.message = err.message;
      logger.info(err);
      return response;
    }
  }
}

module.exports = BucketS3Context;
