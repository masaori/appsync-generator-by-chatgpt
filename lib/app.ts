#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { GraphqlApiStack } from "../lib/graphql-api-stack";

const app = new cdk.App();
new GraphqlApiStack(app, "GraphqlApiStack");
