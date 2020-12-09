#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ArticleCdkStack } from "../lib/article-cdk-stack";

const config = require("../configParameters.json");

const app = new cdk.App();
const prod = { account: config.accountId, region: config.region };

new ArticleCdkStack(app, config.stackName, { env: prod });
