// generateEntityAndRelationDefinitions.test.ts
import {
  EntityDefinition,
  RelationDefinition,
} from "./entities/EntityDefinitions";
import { generateEntityAndRelationDefinitions } from "./generateEntityAndRelationDefinitions";

describe("generateEntityAndRelationDefinitions", () => {
  const input = `
type User = {
  id: string
  name: string
  grade: number
}

type Task = {
  id: string
  description: string
  done: boolean
}

type Assignment  = {
  id: string
  role: string
  userId: User['id']
  taskId: Task['id']
}
`;

  test("parses TypeScript code and returns entityDefinitions and relationDefinitions arrays", () => {
    const result = generateEntityAndRelationDefinitions(input);

    const expectedEntityDefinitions: EntityDefinition[] = [
      {
        name: "User",
        isPrimitive: false,
      },
      {
        name: "Task",
        isPrimitive: false,
      },
      {
        name: "Assignment",
        isPrimitive: false,
      },
      {
        name: "ID",
        isPrimitive: true,
      },
      {
        name: "String",
        isPrimitive: true,
      },
      {
        name: "Int",
        isPrimitive: true,
      },
      {
        name: "Boolean",
        isPrimitive: true,
      },
    ];

    const expectedRelationDefinitions: RelationDefinition[] = [
      {
        name: "id",
        sourceEntityName: "User",
        targetEntityName: "ID",
      },
      {
        name: "name",
        sourceEntityName: "User",
        targetEntityName: "String",
      },
      {
        name: "grade",
        sourceEntityName: "User",
        targetEntityName: "Int",
      },
      {
        name: "id",
        sourceEntityName: "Task",
        targetEntityName: "ID",
      },
      {
        name: "description",
        sourceEntityName: "Task",
        targetEntityName: "String",
      },
      {
        name: "done",
        sourceEntityName: "Task",
        targetEntityName: "Boolean",
      },
      {
        name: "id",
        sourceEntityName: "Assignment",
        targetEntityName: "ID",
      },
      {
        name: "role",
        sourceEntityName: "Assignment",
        targetEntityName: "String",
      },
      {
        name: "userId",
        sourceEntityName: "Assignment",
        targetEntityName: "User",
      },
      {
        name: "taskId",
        sourceEntityName: "Assignment",
        targetEntityName: "Task",
      },
    ];

    expect(result.entityDefinitions).toEqual(expectedEntityDefinitions);
    expect(result.relationDefinitions).toEqual(expectedRelationDefinitions);
  });
});
