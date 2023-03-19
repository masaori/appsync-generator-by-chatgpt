// generateEntityAndRelationDefinitions.ts
import { Project, SyntaxKind } from "ts-morph";
import {
  EntityDefinition,
  RelationDefinition,
} from "./entities/EntityDefinitions";

export function generateEntityAndRelationDefinitions(input: string): {
  entityDefinitions: EntityDefinition[];
  relationDefinitions: RelationDefinition[];
} {
  const project = new Project();
  const sourceFile = project.createSourceFile("temp.ts", input);
  const typeAliases = sourceFile.getTypeAliases();

  const entityDefinitions: EntityDefinition[] = [];
  const relationDefinitions: RelationDefinition[] = [];

  for (const alias of typeAliases) {
    const typeName = alias.getName();
    const members = alias.getType().getProperties();

    entityDefinitions.push({
      name: typeName,
      isPrimitive: false,
    });

    for (const member of members) {
      const valueDeclaration = member.getValueDeclaration();
      if (!valueDeclaration) {
        continue;
      }
      const propertyName = member.getName();
      const typeReferenceNode =
        valueDeclaration.getDescendantsOfKind(SyntaxKind.TypeReference)[0] ||
        null;

      let targetEntityName: string;

      if (propertyName === "id") {
        targetEntityName = "ID";
      } else if (typeReferenceNode) {
        const propertyType = typeReferenceNode.getText();
        switch (propertyType) {
          case "string":
            targetEntityName = "String";
            break;
          case "number":
            targetEntityName = "Int";
            break;
          case "boolean":
            targetEntityName = "Boolean";
            break;
          default:
            const indexedAccessNode = typeReferenceNode.getFirstChildByKind(
              SyntaxKind.IndexedAccessType
            );
            if (indexedAccessNode) {
              targetEntityName = indexedAccessNode
                .getText()
                .split("[")[0]
                .trim();
            } else {
              targetEntityName = typeReferenceNode.getText();
            }
            break;
        }
      } else {
        const propertyType = project
          .getTypeChecker()
          .getTypeAtLocation(valueDeclaration)
          .getText();

        switch (propertyType) {
          case "string":
            targetEntityName = "String";
            break;
          case "number":
            targetEntityName = "Int";
            break;
          case "boolean":
            targetEntityName = "Boolean";
            break;
          default:
            targetEntityName = propertyType;
            break;
        }
      }

      relationDefinitions.push({
        name: propertyName,
        sourceEntityName: typeName,
        targetEntityName: targetEntityName,
      });
    }
  }

  // Add primitive types
  entityDefinitions.push(
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
    }
  );

  return {
    entityDefinitions,
    relationDefinitions,
  };
}
