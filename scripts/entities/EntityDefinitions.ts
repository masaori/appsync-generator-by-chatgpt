export type RelationDefinition = {
  name: string;
  sourceEntityName: EntityDefinition["name"];
  targetEntityName: EntityDefinition["name"];
};

export type EntityDefinition = {
  name: string;
  isPrimitive: boolean;
};
