import { buildSchema, GraphQLObjectType } from "graphql";

const schema = buildSchema(
  `

schema {
  query: Query
  mutation: Mutation
}

type Query {

  user(id: ID!): UserQueryResult

  users: UsersQueryResult

  task(id: ID!): TaskQueryResult

  tasks: TasksQueryResult

  assignment(id: ID!): AssignmentQueryResult

  assignments: AssignmentsQueryResult

  assignmentsByUserId(id: ID!): AssignmentsByUserIdQueryResult

  assignmentsByTaskId(id: ID!): AssignmentsByTaskIdQueryResult
}

type Mutation {

  createUser(input: UserInput!): CreateUserMutationResult
  updateUser(id: ID!, input: UserInput!): UpdateUserMutationResult
  deleteUser(id: ID!): DeleteUserMutationResult

  createTask(input: TaskInput!): CreateTaskMutationResult
  updateTask(id: ID!, input: TaskInput!): UpdateTaskMutationResult
  deleteTask(id: ID!): DeleteTaskMutationResult

  createAssignment(input: AssignmentInput!): CreateAssignmentMutationResult
  updateAssignment(id: ID!, input: AssignmentInput!): UpdateAssignmentMutationResult
  deleteAssignment(id: ID!): DeleteAssignmentMutationResult
}


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


type User {
  id: ID!
  name: String!
  grade: Int!
}

union UserQueryResult = User | PermissionError | UnknownRuntimeError | NotFoundError

union UsersQueryResult = [User] | PermissionError | UnknownRuntimeError

union CreateUserMutationResult = User | PermissionError | UnknownRuntimeError

union UpdateUserMutationResult = User | PermissionError | UnknownRuntimeError | NotFoundError

union DeleteUserMutationResult = User | PermissionError | UnknownRuntimeError | NotFoundError

input UserInput {
  name: String!
  grade: Int!
}

type Task {
  id: ID!
  description: String!
}

union TaskQueryResult = Task | PermissionError | UnknownRuntimeError | NotFoundError

union TasksQueryResult = [Task] | PermissionError | UnknownRuntimeError

union CreateTaskMutationResult = Task | PermissionError | UnknownRuntimeError

union UpdateTaskMutationResult = Task | PermissionError | UnknownRuntimeError | NotFoundError

union DeleteTaskMutationResult = Task | PermissionError | UnknownRuntimeError | NotFoundError

input TaskInput {
  description: String!
}

type Assignment {
  id: ID!
  user: User!
  task: Task!
}

union AssignmentQueryResult = Assignment | PermissionError | UnknownRuntimeError | NotFoundError

union AssignmentsQueryResult = [Assignment] | PermissionError | UnknownRuntimeError

union AssignmentsByUserIdQueryResult = [Assignment] | PermissionError | UnknownRuntimeError

union AssignmentsByTaskIdQueryResult = [Assignment] | PermissionError | UnknownRuntimeError

union CreateAssignmentMutationResult = Assignment | PermissionError | UnknownRuntimeError

union UpdateAssignmentMutationResult = Assignment | PermissionError | UnknownRuntimeError | NotFoundError

union DeleteAssignmentMutationResult = Assignment | PermissionError | UnknownRuntimeError | NotFoundError

input AssignmentInput {
  user: User!
  task: Task!
}

  `
);
const queryType = schema.getQueryType();
const mutationType = schema.getMutationType();

// Query
if (queryType) {
  console.log(queryType.getFields());
}
