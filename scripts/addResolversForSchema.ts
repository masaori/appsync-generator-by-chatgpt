import * as appsync from "@aws-cdk/aws-appsync";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { buildSchema, GraphQLObjectType } from "graphql";

// スキーマをパースしてリゾルバを追加する関数
export function addResolversForSchema(
  api: appsync.GraphqlApi,
  schemaString: string
) {
  const schema = buildSchema(schemaString);
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  // Query
  if (queryType) {
    console.log(queryType.getFields());

    for (const field of Object.values(queryType.getFields())) {
      const typeName = queryType.name;
      const fieldName = field.name;

      // DynamoDBデータソースを取得するか、生成してリゾルバに使用する。
      // ここでは単純にフィールド名を使用していますが、実際にはより柔軟なマッピングが必要かもしれません。
      let dataSource: appsync.BaseDataSource | undefined =
        api.node.tryFindChild(
          `DataSource:${fieldName}`
        ) as appsync.BaseDataSource;
      if (!dataSource) {
        const table = new dynamodb.Table(api.stack, `${fieldName}Table`, {
          partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        });
        dataSource = api.addDynamoDbDataSource(`${fieldName}DataSource`, table);
      }

      // Query用のリゾルバを追加
      api.createResolver({
        typeName,
        fieldName,
        dataSource,
        requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
          "id",
          "id"
        ),
        responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
      });
    }
  }

  // Mutation
  if (mutationType) {
    for (const field of Object.values(mutationType.getFields())) {
      const typeName = mutationType.name;
      const fieldName = field.name;

      // DynamoDBデータソースを取得するか、生成してリゾルバに使用する。
      // ここでは単純にフィールド名を使用していますが、実際にはより柔軟なマッピングが必要かもしれません。
      let dataSource = api.node.tryFindChild(
        `DataSource:${fieldName}`
      ) as appsync.BaseDataSource;
      if (!dataSource) {
        const table = new dynamodb.Table(api.stack, `${fieldName}Table`, {
          partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        });
        dataSource = api.addDynamoDbDataSource(`${fieldName}DataSource`, table);
      }

      // Mutation用のリゾルバを追加
      api.createResolver({
        typeName,
        fieldName,
        dataSource,
        requestMappingTemplate: getRequestTemplate(fieldName),
        responseMappingTemplate: getResponseTemplate(fieldName),
      });
    }
  }
}

// Requestマッピングテンプレートを生成するヘルパー関数
function getRequestTemplate(fieldName: string): appsync.MappingTemplate {
  if (fieldName.startsWith("create")) {
    return appsync.MappingTemplate.dynamoDbPutItem(
      appsync.PrimaryKey.partition("id").auto(),
      appsync.Values.projecting("input")
    );
  } else if (fieldName.startsWith("update")) {
    return appsync.MappingTemplate.dynamoDbPutItem(
      appsync.PrimaryKey.partition("id").is("ctx.args.id"),
      appsync.Values.projecting("input")
    );
  } else if (fieldName.startsWith("delete")) {
    return appsync.MappingTemplate.dynamoDbDeleteItem("id", `ctx.args.id`);
  } else {
    return appsync.MappingTemplate.dynamoDbGetItem("id", `ctx.args.id`);
  }
}

// Responseマッピングテンプレートを生成するヘルパー関数
function getResponseTemplate(fieldName: string): appsync.MappingTemplate {
  if (
    fieldName.startsWith("create") ||
    fieldName.startsWith("update") ||
    fieldName.startsWith("delete")
  ) {
    return appsync.MappingTemplate.dynamoDbResultItem();
  } else {
    return appsync.MappingTemplate.dynamoDbResultList();
  }
}

// CDKスタック内で、この関数を使用してリゾルバを動的に追加します。
// addResolversForSchema(api, schemaString);
