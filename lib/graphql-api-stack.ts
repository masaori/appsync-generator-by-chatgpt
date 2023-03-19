import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import { generateEntityAndRelationDefinitions } from "../scripts/generateEntityAndRelationDefinitions";

export class GraphqlApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "example-api",
      schema: appsync.Schema.fromAsset("lib/graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      xrayEnabled: true,
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || "",
    });

    const dynamoDbAppSyncRole = new iam.Role(this, "DynamoDbAppSyncRole", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    // Mapping templates
    const getById = () =>
      appsync.MappingTemplate.dynamoDbGetItem("id", `ctx.args.id`);
    const getList = () => appsync.MappingTemplate.dynamoDbScanTable();
    const create = () =>
      appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").auto(),
        appsync.Values.projecting("input")
      );
    const update = () =>
      appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").is("ctx.args.id"),
        appsync.Values.projecting("input")
      );
    const deleteItem = () =>
      appsync.MappingTemplate.dynamoDbDeleteItem("id", `ctx.args.id`);

    const { entityDefinitions, relationDefinitions } =
      generateEntityAndRelationDefinitions("");

    for (const entity of entityDefinitions) {
      const table = new ddb.Table(this, `${entity.name}Table`, {
        partitionKey: { name: "id", type: ddb.AttributeType.STRING },
        billingMode: ddb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      });

      dynamoDbAppSyncRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          resources: [table.tableArn],
        })
      );

      const dataSource = new appsync.DynamoDbDataSource(
        this,
        `${entity.name}DataSource`,
        {
          api: api,
          name: `${entity.name}DataSource`,
          table: table,
          serviceRole: dynamoDbAppSyncRole,
        }
      );

      const responseMappingTemplateItem = appsync.MappingTemplate.fromString(`
        ## If there's an error, return UnknownRuntimeError
        #if($ctx.error)
        $util.qr($ctx.result.put("__typename", "UnknownRuntimeError"))
        $util.qr($ctx.result.put("message", "An unknown error occurred during runtime."))
        $util.qr($ctx.result.put("details", $ctx.error))
        $util.toJson($ctx.result)
      #else
        ## If the result is not found, return NotFoundError
        #if(!$ctx.result)
          $util.qr($ctx.result.put("__typename", "NotFoundError"))
          $util.qr($ctx.result.put("message", "${entity.name} not found."))
          $util.toJson($ctx.result)
        #else
          $util.qr($ctx.result.put("__typename", "${entity.name}"))
          $util.toJson($ctx.result)
        #end
      #end
    `);

      // Query resolvers
      api.createResolver({
        typeName: "Query",
        fieldName: `${entity.name.toLowerCase()}`,
        dataSource: dataSource,
        requestMappingTemplate: getById(),
        responseMappingTemplate: responseMappingTemplateItem,
      });

      api.createResolver({
        typeName: "Query",
        fieldName: `${entity.name.toLowerCase()}s`,
        dataSource: dataSource,
        requestMappingTemplate: getList(),
        responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
      });

      // Mutation resolvers
      api.createResolver({
        typeName: "Mutation",
        fieldName: `create${entity.name}`,
        dataSource: dataSource,
        requestMappingTemplate: create(),
        responseMappingTemplate: responseMappingTemplateItem,
      });

      api.createResolver({
        typeName: "Mutation",
        fieldName: `update${entity.name}`,
        dataSource: dataSource,
        requestMappingTemplate: update(),
        responseMappingTemplate: responseMappingTemplateItem,
      });

      api.createResolver({
        typeName: "Mutation",
        fieldName: `delete${entity.name}`,
        dataSource: dataSource,
        requestMappingTemplate: deleteItem(),
        responseMappingTemplate: responseMappingTemplateItem,
      });
    }
  }
}
