import fs from "fs";
import {
  EntityDefinition,
  RelationDefinition,
} from "./entities/EntityDefinitions";

export function generateGraphQLSchema(
  entityDefinitions: EntityDefinition[],
  relationDefinitions: RelationDefinition[]
): string {
  const typeDefs: string[] = [];
  const queryTypeDefs: string[] = [];
  const mutationTypeDefs: string[] = [];

  const errorTypes = `
type PermissionError {
  code: String!
  message: String!
}

type UnknownRuntimeError {
  code: String!
  message: String!
}

type NotFoundError {
  code: String!
  message: String!
}
`;

  typeDefs.push(errorTypes);

  entityDefinitions.forEach((entity) => {
    if (!entity.isPrimitive) {
      const relations = relationDefinitions.filter(
        (relation) => relation.sourceEntityName === entity.name
      );

      const fields = relations.map((relation) => {
        const targetEntity = entityDefinitions.find(
          (e) => e.name === relation.targetEntityName
        );

        const fieldName =
          targetEntity && !targetEntity.isPrimitive
            ? relation.name.replace(/Id$/, "")
            : relation.name;

        return `${fieldName}: ${relation.targetEntityName}!`;
      });

      const entityType = `
type ${entity.name} {
  id: ID!
  ${fields.join("\n  ")}
}`;

      typeDefs.push(entityType);

      const entityConnection = `
type ${entity.name}sConnection {
  items: [${entity.name}!]!
  count: Int!
}`;

      typeDefs.push(entityConnection);

      // 1. IDを指定して単体で取得するquery
      const entityQuery = `
  ${entity.name.charAt(0).toLowerCase() + entity.name.slice(1)}(id: ID!): ${
        entity.name
      }QueryResult`;
      queryTypeDefs.push(entityQuery);

      const entityQueryResult = `
union ${entity.name}QueryResult = ${entity.name} | PermissionError | UnknownRuntimeError | NotFoundError`;
      typeDefs.push(entityQueryResult);

      // 2. 全レコードを配列で取得するquery
      const pluralEntityName = entity.name + "s";
      const allEntitiesQuery = `
  ${pluralEntityName.charAt(0).toLowerCase() + pluralEntityName.slice(1)}: ${
        entity.name
      }sConnection`;
      queryTypeDefs.push(allEntitiesQuery);

      // 3. 親エンティティを持つ場合は、親エンティティのidをキーとして配列で取得するquery
      const parentEntityQueries = relations
        .filter((relation) => {
          const targetEntity = entityDefinitions.find(
            (e) => e.name === relation.targetEntityName
          );
          return targetEntity && !targetEntity.isPrimitive;
        })
        .map((relation) => {
          const targetEntityName = relation.targetEntityName;
          const queryName = `${entity.name}sBy${targetEntityName}Id`;
          const customQueryResultName = `${queryName}QueryResult`;

          typeDefs.push(
            `union ${customQueryResultName} = ${entity.name}sConnection | PermissionError | UnknownRuntimeError`
          );

          return (
            queryName.charAt(0).toLowerCase() +
            queryName.slice(1) +
            "(id: ID!): " +
            customQueryResultName
          );
        });
      if (parentEntityQueries.length > 0) {
        queryTypeDefs.push(...parentEntityQueries);
      }

      const entityMutation = `
    create${entity.name}(input: ${entity.name}Input!): Create${entity.name}MutationResult
    update${entity.name}(id: ID!, input: ${entity.name}Input!): Update${entity.name}MutationResult
    delete${entity.name}(id: ID!): Delete${entity.name}MutationResult`;
      mutationTypeDefs.push(entityMutation);

      const createMutationResult = `
  union Create${entity.name}MutationResult = ${entity.name} | PermissionError | UnknownRuntimeError`;
      typeDefs.push(createMutationResult);

      const updateMutationResult = `
  union Update${entity.name}MutationResult = ${entity.name} | PermissionError | UnknownRuntimeError | NotFoundError`;
      typeDefs.push(updateMutationResult);

      const deleteMutationResult = `
  union Delete${entity.name}MutationResult = ${entity.name} | PermissionError | UnknownRuntimeError | NotFoundError`;
      typeDefs.push(deleteMutationResult);

      const inputType = `
  input ${entity.name}Input {
    ${fields.join("\n  ")}
  }`;
      typeDefs.push(inputType);
    }
  });

  const schema = `
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
  ${queryTypeDefs.join("\n")}
  }

  type Mutation {
  ${mutationTypeDefs.join("\n")}
  }

  ${typeDefs.join("\n")}
  `;

  return schema;
}

// Usage Example
// const schema = generateGraphQLSchema(entityDefinitions, relationDefinitions);
// fs.writeFileSync("schema.graphql", schema);
