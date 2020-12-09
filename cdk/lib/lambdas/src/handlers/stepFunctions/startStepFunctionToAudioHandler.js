const aws = require("aws-sdk");
const config = require("../../config.json");

const stepFunctions = new aws.StepFunctions();

var s3 = new aws.S3({ apiVersion: "2006-03-01" });

const nameData = (date) => {
  const response = new Date(parseInt(date)).getTime().toString();
  return `audio-${response.replace("/", "-").replace("/", "-")}`;
};

exports.handler = (events) => {
  console.log(events);
  const serializedEvents = events.Records.map((record) =>
    JSON.parse(
      new Buffer.from(record.kinesis.data, "base64").toString("binary")
    )
  );
  console.log(serializedEvents);
  for (const event of serializedEvents) {
    const datas = event[0];
    const param = {
      Bucket: config.aws.bucketName,
      Key: `audio-${new Date().getTime().toString()}.mp3`,
      Body: Buffer.from(datas.inputText, "ascii"),
      ContentType: "audio/mp3",
      ACL: "public-read",
    };
    console.log(param);
    s3.upload(param, function (err, data) {
      if (err) {
        throw err;
      }
      const audioLocation = data.Location;
      console.log(`File uploaded successfully. ${data.Location}`);
      const location = {
        ...datas,
        audioUrl: audioLocation,
      };
      delete location.inputText;
      const params = {
        stateMachineArn: process.env.STEP_FUNCTION_ARN,
        input: JSON.stringify(location),
      };
      stepFunctions.startExecution(params, function (err, data) {
        console.log(JSON.stringify(err));
        console.log(JSON.stringify(data));
        if (err) {
          console.log("err while executing step function");
        } else {
          console.log("started execution of step function");
        }
      });
    });
  }
};
