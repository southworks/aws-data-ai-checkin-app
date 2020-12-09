const AWS = require("aws-sdk");
const config = require("./config.json");

AWS.config.region = config.region;

const lexmodelbuildingservice = new AWS.LexModelBuildingService();

const positive = require("../../backend/lex/Positive.json");
const negative = require("../../backend/lex/Negative.json");
const neutral = require("../../backend/lex/Neutral.json");
const mixed = require("../../backend/lex/Mixed.json");
const feelingTrackerBot = require("../../backend/lex/FeelingTrackerBot.json");

const alias = {
  name: "FeelingTracker" /* required */,
  botName: feelingTrackerBot.name /* required */,
};

(async function main() {
  await deleteBotAlias(alias);
  await deleteBot(feelingTrackerBot);
  await deleteIntent(positive);
  await deleteIntent(negative);
  await deleteIntent(neutral);
  await deleteIntent(mixed);
  console.log(`Bot deleted from ${config.region}!`);
})();

async function deleteBotAlias(alias) {
  await lexmodelbuildingservice.deleteBotAlias(alias).promise();

  function getUntilDeleted(resolve) {
    lexmodelbuildingservice.getBotAlias(alias, (err, data) => {
      if (data) setTimeout(() => getUntilDeleted(resolve), 200);
      else resolve();
    });
  }

  return new Promise((resolve, reject) => {
    getUntilDeleted(resolve, alias);
  });
}

async function deleteIntent(intent) {
  await lexmodelbuildingservice.deleteIntent({ name: intent.name }).promise();

  const params = { name: intent.name, version: "$LATEST" };

  function getUntilDeleted(resolve) {
    lexmodelbuildingservice.getIntent(params, (err, data) => {
      if (data) setTimeout(() => getUntilDeleted(resolve), 200);
      else resolve();
    });
  }

  return new Promise((resolve, reject) => {
    getUntilDeleted(resolve, intent);
  });
}

async function deleteBot(bot) {
  await lexmodelbuildingservice.deleteBot({ name: bot.name }).promise();

  const params = { name: bot.name, versionOrAlias: "$LATEST" };

  function getUntilDeleted(resolve) {
    lexmodelbuildingservice.getBot(params, async (err, data) => {
      if (data) setTimeout(() => getUntilDeleted(resolve), 200);
      else resolve();
    });
  }

  return new Promise((resolve, reject) => {
    getUntilDeleted(resolve);
  });
}
