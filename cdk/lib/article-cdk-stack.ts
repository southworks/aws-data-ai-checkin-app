import * as cdk from "@aws-cdk/core";
import * as kinesis from "@aws-cdk/aws-kinesis";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigateway";
import { v4 as uuidv4 } from "uuid";
import * as resourceBucketS3 from "../resources/bucketS3";
import * as resourceDynamoDB from "../resources/dynamoDB";

import { KinesisEventSource } from "@aws-cdk/aws-lambda-event-sources";

import path = require("path");
import { IFunction } from "@aws-cdk/aws-lambda";

import * as config from "../configParameters.json";
import * as dynamocnf from "./lambdas/src/config.json";

export class ArticleCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    global.Buffer = global.Buffer || require("buffer").Buffer;

    //Tag resources of the cdk
    cdk.Tag.add(this, "project", "samarkand");

    //Declaration of common variables
    const region = config.region;
    const accountId = config.accountId;
    const resourcesPrefix = config.resourcesPrefix;

    //Resources Names
    const lexDataStreamName = `${resourcesPrefix}-lexDataStream`;
    const lexDataStreamToAudioName = `${resourcesPrefix}-lexDataStreamToAudio`;
    const messagesBucketName = `${config.resourcesPrefix}-bucket`;
    const neutralMessagesBucketName = `${config.resourcesPrefix}-bucket-neutral`;
    const lambdaSaveToS3Name = `${resourcesPrefix}saveToS3`;
    const lambdaGetIntent = `${resourcesPrefix}getIntent`;
    const stepFnProcessLex = `${resourcesPrefix}ProcessLex`;
    const stepFnSaveToBucketS3 = `${resourcesPrefix}saveToBucketS3`;
    const stepFnSaveToDynamoDB = `${resourcesPrefix}saveToDynamoDB`;
    const stepFnProcessKinesisWithLex = `${resourcesPrefix}processKinesisWithLex`;
    const lambdaStartStepFunctionName = `${resourcesPrefix}startStepFunction`;
    const lambdaTranscribeSpeechToTextName = `${resourcesPrefix}transcribeSpeechToText`;
    const stepFnSpeechToTextName = `${resourcesPrefix}speechToText`;
    const stepFnDataMappingName = `${resourcesPrefix}dataMapping`;
    const stepFnTranscribedTextToKinesisName = `${resourcesPrefix}transcribedTextToKinesis`;
    const stepFnProcessKinesistoAudioName = `${resourcesPrefix}processKinesistoAudio`;
    const lambdaStartStepFunctionToAudioName = `${resourcesPrefix}startStepFunctionToAudio`;
    const apiName = `${resourcesPrefix}Api`;
    const lambdaTrainBotName = `${resourcesPrefix}trainBot`;

    //Execution Role
    const executeRole = new iam.Role(this, "role", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    // DynamoDB
    const createTables = async () => {
      const feelingTable = {
        tableName: `${dynamocnf.aws.dynamoDB.feelingTable.name}`,
        partitionKeyName: "id",
        partitionKeyType: dynamodb.AttributeType.STRING,
        sortKeyName: "dateTime",
        sortKeyType: dynamodb.AttributeType.NUMBER,
      };
      resourceDynamoDB.createTable(this, feelingTable);
    };
    createTables();

    // KDS
    const lexDataStream = new kinesis.Stream(this, lexDataStreamName, {
      streamName: lexDataStreamName,
    });

    lexDataStream.grantReadWrite(executeRole);

    // KDS to audio
    const lexDataStreamToAudio = new kinesis.Stream(
      this,
      lexDataStreamToAudioName,
      {
        streamName: lexDataStreamToAudioName,
      }
    );

    lexDataStreamToAudio.grantReadWrite(executeRole);

    resourceBucketS3.createBucket(this, { name: messagesBucketName });

    resourceBucketS3.createBucket(this, { name: neutralMessagesBucketName });

    // Lambda to save in buckets
    const saveToS3 = new lambda.Function(this, lambdaSaveToS3Name, {
      functionName: lambdaSaveToS3Name,
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "handlers/bucketS3/saveFeelingBucket.handler",
      timeout: cdk.Duration.seconds(10),
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
    });

    saveToS3.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*"],
        resources: ["*"],
      })
    );

    // Lambda to save feeling
    const createFeeling = new lambda.Function(this, "createFeeling", {
      functionName: `${resourcesPrefix}createFeeling`,
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "handlers/feelings/createFeeling.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
    });

    createFeeling.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:PutItem", "dynamodb:Query"],
        resources: [
          `arn:aws:dynamodb:${region}:${accountId}:table/${dynamocnf.aws.dynamoDB.feelingTable.name}`,
        ],
      })
    );

    //Participant Feelings by id
    const getUserFeelings = new lambda.Function(this, "getUserFeelings", {
      functionName: `${resourcesPrefix}getUserFeelings`,
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.minutes(2),
      handler: "handlers/feelings/getUserFeelings.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")),
    });

    getUserFeelings.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:GetRecords",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:Query",
        ],
        resources: [
          `arn:aws:dynamodb:${region}:${accountId}:table/${dynamocnf.aws.dynamoDB.feelingTable.name}`,
        ],
      })
    );

    // Lambda to process feeling
    const getIntent = new lambda.Function(this, lambdaGetIntent, {
      functionName: lambdaGetIntent,
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: "handlers/getIntent/getIntentHandler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
    });

    getIntent.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["lex:*"],
        resources: ["*"],
      })
    );

    // Step Function definition
    const processLex = new sfn.Task(this, stepFnProcessLex, {
      task: new tasks.RunLambdaTask(getIntent),
      resultPath: "$.lexResult",
    });

    const comprehend = new sfn.Pass(this, "Comprehend", {
      parameters: {
        id: uuidv4(),
        "inputText.$": "$.inputText",
        "userId.$": "$.userId",
        "audioUrl.$": "$.audioUrl",
        recognizedBy: "comprehend",
        lexResult: {
          Payload: {
            "intentName.$":
              "$.lexResult.Payload.sentimentResponse.sentimentLabel",
          },
        },
      },
    });

    const recognixedByLex = new sfn.Pass(this, "Recognized by LEX", {
      parameters: {
        id: uuidv4(),
        "inputText.$": "$.inputText",
        "userId.$": "$.userId",
        "audioUrl.$": "$.audioUrl",
        recognizedBy: "lex",
        "lexResult.$": "$.lexResult",
      },
    });

    const saveToBucketS3 = new tasks.LambdaInvoke(this, stepFnSaveToBucketS3, {
      lambdaFunction: saveToS3,
      resultPath: "$.saveResponse",
    });

    recognixedByLex.next(saveToBucketS3);
    comprehend.next(saveToBucketS3);

    const saveToDynamoDB = new tasks.LambdaInvoke(this, stepFnSaveToDynamoDB, {
      lambdaFunction: createFeeling,
    });

    saveToBucketS3.next(saveToDynamoDB);

    // comprehend.next(
    //   new sfn.Choice(this, "Result is neutral?")
    //     .when(
    //       sfn.Condition.or(
    //         sfn.Condition.stringEquals(
    //           "$.lexResult.Payload.intentName",
    //           "NEUTRAL"
    //         ),
    //         sfn.Condition.stringEquals(
    //           "$.lexResult.Payload.intentName",
    //           "MIXED"
    //         )
    //       ),
    //       saveToBucketS3,
    //     )
    //     .otherwise(saveToBucketS3)
    // );

    let definition = processLex.next(
      new sfn.Choice(this, "Intent is not null?")
        .when(
          sfn.Condition.stringGreaterThanEquals(
            "$.lexResult.Payload.intentName",
            ""
          ),
          recognixedByLex
        )
        .otherwise(comprehend)
    );

    const processKinesisWithLex = new sfn.StateMachine(
      this,
      stepFnProcessKinesisWithLex,
      {
        stateMachineName: stepFnProcessKinesisWithLex,
        definition,
        timeout: cdk.Duration.seconds(30),
      }
    );

    processKinesisWithLex.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["lambda:InvokeFunction", "lambda:InvokeFunction"],
        resources: [
          `arn:aws:lambda:${region}:${accountId}:function:${getIntent.functionName}`,
          `arn:aws:lambda:${region}:${accountId}:function:${saveToS3.functionName}`,
        ],
      })
    );

    // Lambda to start Step Function
    const kinesisEventSource = new KinesisEventSource(lexDataStream, {
      startingPosition: lambda.StartingPosition.LATEST,
    });

    const startStepFunction = new lambda.Function(
      this,
      lambdaStartStepFunctionName,
      {
        functionName: lambdaStartStepFunctionName,
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: "handlers/stepFunctions/startStepFunctionHandler.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed

        environment: {
          STEP_FUNCTION_ARN: processKinesisWithLex.stateMachineArn,
        },
      }
    );

    startStepFunction.addEventSource(kinesisEventSource);

    startStepFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:*"],
        resources: ["*"],
      })
    );

    // Lambda to transcribe speech to text
    const transcribeSpeechToText = new lambda.Function(
      this,
      lambdaTranscribeSpeechToTextName,
      {
        functionName: lambdaTranscribeSpeechToTextName,
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: "handlers/transcribeToText/speechToText.handler",
        timeout: cdk.Duration.minutes(6),
        code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
      }
    );

    transcribeSpeechToText.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*"],
        resources: ["arn:aws:s3:::*/*"],
      })
    );

    transcribeSpeechToText.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "transcribe:GetTranscriptionJob",
          "transcribe:StartTranscriptionJob",
        ],
        resources: ["*"],
      })
    );

    // Lambda to execute step function with text transcribed
    const sendTranscribedTextToKinesis = new lambda.Function(
      this,
      "sendTranscribedTextToKinesis",
      {
        functionName: `${resourcesPrefix}sendTranscribedTextToKinesis`,
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: "handlers/transcribeToText/sendTranscribedTextToKinesis.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
      }
    );

    sendTranscribedTextToKinesis.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:StartExecution"],
        resources: ["arn:aws:states:*:*:stateMachine:*"],
      })
    );

    // Step Function definition to Audio
    const speechToText = new sfn.Task(this, stepFnSpeechToTextName, {
      task: new tasks.RunLambdaTask(transcribeSpeechToText),
      resultPath: "$.transcribeResult",
    });

    const dataMapping = new sfn.Pass(this, stepFnDataMappingName, {
      parameters: {
        "inputText.$": "$.transcribeResult.Payload",
        "audioUrl.$": "$.audioUrl",
        bucketName: messagesBucketName,
        "userId.$": "$.userId",
      },
    });
    //speechToText.next(dataMapping);

    const transcribedTextToKinesis = new sfn.Task(
      this,
      stepFnTranscribedTextToKinesisName,
      {
        task: new tasks.RunLambdaTask(sendTranscribedTextToKinesis),
        resultPath: "$.transcribeResult",
      }
    );
    //dataMapping.next(toStepFunctionText);

    definition = speechToText.next(dataMapping).next(transcribedTextToKinesis);

    const processKinesistoAudio = new sfn.StateMachine(
      this,
      stepFnProcessKinesistoAudioName,
      {
        stateMachineName: stepFnProcessKinesistoAudioName,
        definition,
        timeout: cdk.Duration.seconds(300),
      }
    );

    processKinesistoAudio.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["lambda:InvokeFunction", "lambda:InvokeFunction"],
        resources: [
          `arn:aws:lambda:${region}:${accountId}:function:${getIntent.functionName}`,
          `arn:aws:lambda:${region}:${accountId}:function:${saveToS3.functionName}`,
        ],
      })
    );

    // Lambda to start Step Function to Audio
    const kinesisToAudioEventSource = new KinesisEventSource(
      lexDataStreamToAudio,
      {
        startingPosition: lambda.StartingPosition.LATEST,
      }
    );

    const startStepFunctionToAudio = new lambda.Function(
      this,
      lambdaStartStepFunctionToAudioName,
      {
        functionName: lambdaStartStepFunctionToAudioName,
        runtime: lambda.Runtime.NODEJS_10_X,
        handler:
          "handlers/stepFunctions/startStepFunctionToAudioHandler.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // relative to where cdk is executed
        environment: {
          STEP_FUNCTION_ARN: processKinesistoAudio.stateMachineArn,
        },
      }
    );

    startStepFunctionToAudio.addEventSource(kinesisToAudioEventSource);

    startStepFunctionToAudio.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:*", "s3:*"],
        resources: ["*", "arn:aws:s3:::*"],
      })
    );

    // Train BOT
    const trainBot = new lambda.Function(this, lambdaTrainBotName, {
      functionName: lambdaTrainBotName,
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.minutes(2),
      handler: "handlers/messages/rateMessage.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/src")), // TODO: modify to copy automatically the API project to lib
    });

    trainBot.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lex:GetBot",
          "lex:GetIntent",
          "lex:PutIntent",
          "lex:PutBot",
          "lex:GetSlotType",
          "s3:DeleteObject",
          "s3:DeleteBucket",
          "lex:PutSlotType",
          "lex:GetIntentVersions",
          "lex:GetSlotType",
          "lex:GetSlotTypeVersions",
        ],
        resources: [
          `arn:aws:dynamodb:${region}:${accountId}:table/Group`,
          `arn:aws:lex:${region}:${accountId}:bot:FeelingTracker:FeelingTracker`,
          `arn:aws:lex:${region}:${accountId}:intent:*:*`,
          `arn:aws:lex:${region}:${accountId}:bot:FeelingTracker:$LATEST`,
          `arn:aws:lex:${region}:${accountId}:slottype:*:*`,
          `arn:aws:s3:::${messagesBucketName}`,
          `arn:aws:s3:::${messagesBucketName}/*`,
          `arn:aws:lex:${region}:${accountId}:intent:*:*`,
        ],
      })
    );

    // API Gateway
    const APIMethod = {
      GET: "GET",
      POST: "POST",
      PUT: "PUT",
      DELETE: "DELETE",
      PATCH: "PATCH",
    };

    const api: apiGateway.RestApi = new apiGateway.RestApi(this, apiName, {
      restApiName: apiName,
    });

    const setAPITrigger = (
      api: apiGateway.RestApi,
      apiPath: string,
      APIMethod: string,
      handler: IFunction
    ) => {
      const lambdaIntegration = new apiGateway.LambdaIntegration(handler);

      const resource = api.root.resourceForPath(apiPath);

      resource.addMethod(APIMethod, lambdaIntegration);
    };

    const setAPIProxyKinesis = (
      api: apiGateway.RestApi,
      apiPath: string,
      APIMethod: string,
      streamName: string,
      encode: boolean
    ) => {
      const requestTemplate = {
        StreamName: streamName,
        Data: "$util.base64Encode($input.json('$.Data'))",
        // Data: encode
        //   ? "$util.base64Encode($input.json('$.Data'))"
        //   : "$input.json('$.Data')",
        PartitionKey: streamName,
      };

      const kinesisIntegration = new apiGateway.AwsIntegration({
        service: "kinesis",
        action: "PutRecord",
        subdomain: "",
        integrationHttpMethod: "POST",
        options: {
          credentialsRole: executeRole,
          requestTemplates: {
            ["application/json"]: JSON.stringify(requestTemplate),
          },
          integrationResponses: [
            {
              statusCode: "200",
            },
          ],
        },
      });

      const resource = api.root.resourceForPath(apiPath);

      resource.addMethod(APIMethod, kinesisIntegration, {
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": { modelId: "Empty" },
            },
          },
        ],
      });
    };

    setAPITrigger(api, "messages/train", APIMethod.POST, trainBot);

    setAPITrigger(
      api,
      "feelings/user/{userId}",
      APIMethod.GET,
      getUserFeelings
    );

    setAPIProxyKinesis(
      api,
      "feelings/text",
      APIMethod.PUT,
      lexDataStreamName,
      true
    );

    setAPIProxyKinesis(
      api,
      "feelings/audio",
      APIMethod.PUT,
      lexDataStreamToAudioName,
      true
    );
  }
}
