const AWS = require("aws-sdk");
const config = require("./config.json");

AWS.config.region = config.region;

const lexmodelbuildingservice = new AWS.LexModelBuildingService();

const slotPositive = require("./src/SlotTypePositive.json");
const slotNegative = require("./src/SlotTypeNegative.json");
const slotNeutral = require("./src/SlotTypeNeutral.json");
const positive = require("./src/Positive.json");
const negative = require("./src/Negative.json");
const neutral = require("./src/Neutral.json");
const mixed = require("./src/Mixed.json");
const feelingTrackerBot = require("./src/FeelingTrackerBot.json");

const alias = {
  botName: feelingTrackerBot.name /* required */,
  botVersion: "$LATEST" /* required */,
  name: feelingTrackerBot.name /* required */,
};

(async () => {
  console.log(
    await lexmodelbuildingservice.putSlotType(slotPositive).promise()
  );
  console.log(
    await lexmodelbuildingservice.putSlotType(slotNegative).promise()
  );
  console.log(await lexmodelbuildingservice.putSlotType(slotNeutral).promise());
  console.log(await lexmodelbuildingservice.putIntent(positive).promise());
  console.log(await lexmodelbuildingservice.putIntent(negative).promise());
  console.log(await lexmodelbuildingservice.putIntent(neutral).promise());
  console.log(await lexmodelbuildingservice.putIntent(mixed).promise());
  console.log(
    await lexmodelbuildingservice.putBot(feelingTrackerBot).promise()
  );
  console.log(await lexmodelbuildingservice.putBotAlias(alias).promise());
  console.log(`Bot deployed in ${config.region}!`);
})();
