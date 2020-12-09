console.log("Loading function");

const AWS = require("aws-sdk");

const config = require("../../config.json");

const credentials = new AWS.Credentials({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey
});

AWS.config.update({ credentials: credentials });

const kinesis = new AWS.Kinesis();

exports.handler = (event) => {
  console.log(event);
  const data = [event];
  delete data[0].partitionKey;

  const dataToSend = {
    Data: JSON.stringify(data),
    PartitionKey: "smkarticle-lexDataStream",
    StreamName: "smkarticle-lexDataStream"
  }

  console.log(dataToSend)

  kinesis.putRecord(dataToSend, (err, data) => {
    if (err) {
      console.log(`Error sending data ${dataToSend.Data} to Kinesis.`);
      console.log(err);
    }
    if (data) console.log(`Successfully sent ${data} to Kinesis.`);
  });
};
