const aws = require("aws-sdk");
const config = require("../../config.json");

const transcribeservice = new aws.TranscribeService({
  apiVersion: "2017-10-26",
});
const s3 = new aws.S3({ apiVersion: "2017-10-26" });

const nameTranscriptionName = (text) => {
  const aux = text.split("/");
  const response = aux[aux.length - 1];
  return response.replace(".mp3", "");
};

const getKeyForBucketS3 = (text) => {
  const aux = text.split("/");
  const response = aux[aux.length - 1];
  return response;
};

exports.handler = async (event) => {
  // TODO implement
  console.log(event);
  var params = {
    LanguageCode: "en-US",
    Media: {
      MediaFileUri: event.audioUrl, //`s3://${event.bucketName}/${nameTranscriptionName(event.audio)}.mp3`,//event.audio
    },
    OutputBucketName: config.aws.bucketName,
    MediaFormat: "mp3",
    MediaSampleRateHertz: 48000,
    TranscriptionJobName: nameTranscriptionName(event.audioUrl), //'trasncribeTest550', /* required */
  };
  console.log(params);
  let result = await transcribeservice.startTranscriptionJob(params).promise();
  while (result.TranscriptionJob.TranscriptionJobStatus === "IN_PROGRESS") {
    var p = {
      TranscriptionJobName:
        result.TranscriptionJob.TranscriptionJobName /* required */,
    };
    result = await transcribeservice.getTranscriptionJob(p).promise();
  }
  console.log(result);
  console.log("Finished");

  var par = {
    Bucket: config.aws.bucketName,
    Key: getKeyForBucketS3(
      result.TranscriptionJob.Transcript.TranscriptFileUri
    ),
  };

  const data = await s3.getObject(par).promise();
  const object = JSON.parse(data.Body);
  const inputText = object.results.transcripts[0].transcript;
  return inputText;
};
