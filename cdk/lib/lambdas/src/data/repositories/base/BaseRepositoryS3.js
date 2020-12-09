const logger = require("../../../modules/logger");

class BaseRepositoryS3 {
  constructor(s3Context) {
    this.s3Context = s3Context;
  }
  async find(params) {
    logger.info(`Finding: ${params}`);
    console.log(params);
    const result = await this.s3Context.find(params);
    console.log(result);
    return this.mapItemsToEntities(result.Contents);
  }

  toGroupUtterances(messages) {
    const positive = { messages: [], toDelete: [], toSlotType: [] };
    const negative = { messages: [], toDelete: [], toSlotType: [] };
    const neutral = { messages: [], toDelete: [], toSlotType: [] };
    messages.map((msg) => {
      if (msg.classifiedAs === "Positive") {
        positive.messages = [...positive.messages, ...msg.messages];
        positive.toDelete = [...positive.toDelete, { Key: msg.data.name }];
        positive.toSlotType = [...positive.toSlotType, ...msg.keysWords];
      }
      if (msg.classifiedAs === "Negative") {
        negative.messages = [...negative.messages, ...msg.messages];
        negative.toDelete = [...negative.toDelete, { Key: msg.data.name }];
        negative.toSlotType = [...negative.toSlotType, ...msg.keysWords];
      }
      if (msg.classifiedAs === "Neutral") {
        neutral.messages = [...neutral.messages, ...msg.messages];
        neutral.toDelete = [...neutral.toDelete, { Key: msg.data.name }];
        neutral.toSlotType = [...neutral.toSlotType, ...msg.keysWords];
      }
    });
    return {
      positives: positive,
      negatives: negative,
      neutrals: neutral,
    };
  }

  async rateMessages(params) {
    logger.info("Messages to classify: ");
    console.log(params);
    const intentsWithUtterances = this.toGroupUtterances(params);
    console.log(intentsWithUtterances);
    const result = {
      response: {},
      messageToDelete: [],
      proccessOK: "",
    };

    if (intentsWithUtterances.positives.messages.length > 0) {
      await this.s3Context.addToSlotType(
        intentsWithUtterances.positives.toSlotType,
        "FEELINGSPositive"
      );
      await this.s3Context.addUtterances(
        intentsWithUtterances.positives,
        "Positive"
      );
      result.messageToDelete = [
        ...result.messageToDelete,
        ...intentsWithUtterances.positives.toDelete,
      ];
    }
    if (intentsWithUtterances.negatives.messages.length > 0) {
      await this.s3Context.addToSlotType(
        intentsWithUtterances.negatives.toSlotType,
        "FEELINGSNegative"
      );
      await this.s3Context.addUtterances(
        intentsWithUtterances.negatives,
        "Negative"
      );
      result.messageToDelete = [
        ...result.messageToDelete,
        ...intentsWithUtterances.negatives.toDelete,
      ];
    }
    if (intentsWithUtterances.neutrals.messages.length > 0) {
      await this.s3Context.addToSlotType(
        intentsWithUtterances.neutrals.toSlotType,
        "FEELINGSNeutral"
      );
      await this.s3Context.addUtterances(
        intentsWithUtterances.neutrals,
        "Neutral"
      );
      result.messageToDelete = [
        ...result.messageToDelete,
        ...intentsWithUtterances.neutrals.toDelete,
      ];
    }
    result.response = await this.s3Context.buildBot();

    result.proccessOK = "ok";
    return result;
  }

  checkExistsData(msgs, text) {
    const s = msgs.some(function (item, index) {
      if (item.message === text) {
        return true;
      }
    });
    return s;
  }

  mapItemToEntity() {
    throw new Error("Method not implemented.");
  }
  mapEntityToItem() {
    throw new Error("Method not implemented.");
  }
  mapItemsToEntities() {
    throw new Error("Method not implemented.");
  }
}

module.exports = BaseRepositoryS3;
