export type User = { id: string; name: string };
export type Task = { id: string; description: string };
export type Assignment = { id: string; userId: User["id"]; taskId: Task["id"] };
export type Organization = { id: string; name: string };
export type Group = {
  id: string;
  organizationId: Organization["id"];
  name: string;
};
export type Belonging = {
  id: string;
  userId: User["id"];
  groupId: Group["id"];
};
