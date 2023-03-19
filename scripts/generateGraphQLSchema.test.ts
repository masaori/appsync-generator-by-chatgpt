import { generateGraphQLSchema } from "./generateGraphQLSchema";
import {
  EntityDefinition,
  RelationDefinition,
} from "./entities/EntityDefinitions";
import { buildSchema } from "graphql";

const testEntityDefinitions: EntityDefinition[] = [
  {
    name: "String",
    isPrimitive: true,
  },
  {
    name: "Int",
    isPrimitive: true,
  },
  {
    name: "User",
    isPrimitive: false,
  },
  {
    name: "Post",
    isPrimitive: false,
  },
];

const testRelationDefinitions: RelationDefinition[] = [
  {
    name: "name",
    sourceEntityName: "User",
    targetEntityName: "String",
  },
  {
    name: "age",
    sourceEntityName: "User",
    targetEntityName: "Int",
  },
  {
    name: "authorId",
    sourceEntityName: "Post",
    targetEntityName: "User",
  },
];

describe("generateGraphQLSchema", () => {
  it("should generate a valid schema", () => {
    const schema = generateGraphQLSchema(
      testEntityDefinitions,
      testRelationDefinitions
    );

    // Check for User entity type
    expect(schema).toContain("type User");
    expect(schema).toContain("name: String!");
    expect(schema).toContain("age: Int!");

    // Check for Post entity type
    expect(schema).toContain("type Post");
    expect(schema).toContain("author: User!");

    // Check for Connection types
    expect(schema).toContain("type UsersConnection");
    expect(schema).toContain("items: [User!]!");
    expect(schema).toContain("count: Int!");
    expect(schema).toContain("type PostsConnection");
    expect(schema).toContain("items: [Post!]!");
    expect(schema).toContain("count: Int!");

    // Check for Query type
    expect(schema).toContain("query: Query");
    expect(schema).toContain("user(id: ID!): UserQueryResult");
    expect(schema).toContain("users: UsersConnection");
    expect(schema).toContain("post(id: ID!): PostQueryResult");
    expect(schema).toContain("posts: PostsConnection");
    expect(schema).toContain(
      "postsByUserId(id: ID!): PostsByUserIdQueryResult"
    );

    // Check for Mutation type
    expect(schema).toContain("mutation: Mutation");
    expect(schema).toContain(
      "createUser(input: UserInput!): CreateUserMutationResult"
    );
    expect(schema).toContain(
      "updateUser(id: ID!, input: UserInput!): UpdateUserMutationResult"
    );
    expect(schema).toContain("deleteUser(id: ID!): DeleteUserMutationResult");
    expect(schema).toContain(
      "createPost(input: PostInput!): CreatePostMutationResult"
    );
    expect(schema).toContain(
      "updatePost(id: ID!, input: PostInput!): UpdatePostMutationResult"
    );
    expect(schema).toContain("deletePost(id: ID!): DeletePostMutationResult");

    // Check for Input types
    expect(schema).toContain("input UserInput");
    expect(schema).toContain("input PostInput");

    // Check for Union types
    expect(schema).toContain(
      "union UserQueryResult = User | PermissionError | UnknownRuntimeError | NotFoundError"
    );
    expect(schema).toContain(
      "union PostQueryResult = Post | PermissionError | UnknownRuntimeError | NotFoundError"
    );
    expect(schema).toContain(
      "union CreateUserMutationResult = User | PermissionError | UnknownRuntimeError"
    );
    expect(schema).toContain(
      "union UpdateUserMutationResult = User | PermissionError | UnknownRuntimeError | NotFoundError"
    );
    expect(schema).toContain(
      "union DeleteUserMutationResult = User | PermissionError | UnknownRuntimeError | NotFoundError"
    );
    expect(schema).toContain(
      "union CreatePostMutationResult = Post | PermissionError | UnknownRuntimeError"
    );
    expect(schema).toContain(
      "union UpdatePostMutationResult = Post | PermissionError | UnknownRuntimeError | NotFoundError"
    );
    expect(schema).toContain(
      "union DeletePostMutationResult = Post | PermissionError | UnknownRuntimeError | NotFoundError"
    );

    // Check for Error types
    expect(schema).toContain("type PermissionError");
    expect(schema).toContain("code: String!");
    expect(schema).toContain("message: String!");

    expect(schema).toContain("type UnknownRuntimeError");
    expect(schema).toContain("code: String!");
    expect(schema).toContain("message: String!");

    expect(schema).toContain("type NotFoundError");
    expect(schema).toContain("code: String!");
    expect(schema).toContain("message: String!");
  });

  it("should parse generated schema as a valid GraphQL schema", () => {
    const schema = generateGraphQLSchema(
      testEntityDefinitions,
      testRelationDefinitions
    );

    try {
      const parsedSchema = buildSchema(schema);
      expect(parsedSchema).toBeDefined();
    } catch (error) {
      console.error(schema);
      throw error;
    }
  });
});
