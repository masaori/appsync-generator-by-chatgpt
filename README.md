この Mermaid 形式で表現されたエンティティのセットから、GraphQL のスキーマを生成してください。

```
erDiagram
    User ||--o{ Assignment : has
    Task ||--o{ Assignment : has
    Organization ||--o{ Group : has
    Group ||--o{ Belonging : has
    User ||--o{ Belonging : has

    User {
        string id
        string name
    }

    Task {
        string id
        string description
    }

    Assignment {
        string id
        string userId
        string taskId
    }

    Organization {
        string id
        string name
    }

    Group {
        string id
        string organizationId
        string name
    }

    Belonging {
        string id
        string userId
        string groupId
    }
```

生成するスキーマは、以下の要件に従ってください。

1. Query(id 指定、親 Entity の id 指定、全件取得)と Mutation(create,update,delete)
2. リストを取得する Query に対して以下の機能を提供してください
   - ページング (limit と nextToken を指定する)
   - 総数
3. エラー処理
   - 以下の 3 つの型を追加してください
     - PermissionError
     - UnkownRuntimeError
     - (id を指定する Query と Mutation にのみ) NotFoundError
   - typescript 側でタイプガードが使えるように、これらを別の type として定義して、ユニオン型として定義してください。
