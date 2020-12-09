const AWS = require("aws-sdk");

AWS.config;

const params = {
  stateMachineArn: process.env.STEP_FUNCTION_ARN,
  // input: JSON.stringify({}), // Optional if your statemachine requires an application/json input, make sure its stringified
  // name: '', // name can be anything you want, but it should change for every execution
};

const stepFunctions = new AWS.StepFunctions();
exports.handler = async (event, context) => {
  console.log(`Recieved record: ${JSON.stringify(event.Records)}`);
  for (var i = 0; i < event.Records.length; i++) {
    const record = event.Records[i];
    // Kinesis data is base64 encoded so decode here
    console.log(`record: ${JSON.stringify(record)}`);
    const payload = Buffer.from(record.kinesis.data, "base64").toString();

    params.input = JSON.stringify(JSON.parse(payload)[0]);
    console.log(JSON.parse(payload)[0]);

    const sf = await stepFunctions.startExecution(params).promise();
    console.log(`sf: ${JSON.stringify(sf)}`);
  }
};
