const AWS = require("aws-sdk");

const lexruntime = new AWS.LexRuntime({ apiVersion: "2016-11-28" });

const params = {
  botAlias: "FeelingTracker" /* required */,
  botName: "FeelingTracker" /* required */,
  inputText: "" /* required */,
  userId: "" /* required */,
};

exports.handler = async (event) => {
  console.log(event);
  params.inputText = event.inputText;
  params.userId = event.userId;

  return lexruntime.postText(params).promise();
};
