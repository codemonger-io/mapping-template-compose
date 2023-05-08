# Supported Patterns

You can compose a mapping template that has a pattern described here.

All of the patterns described here are tested in [`test/compose.test.ts`](./test/compose.test.ts).

## Simple properties

You can describe an object with one or more properties.

```ts
import { composeMappingTemplate } from 'mapping-template-compose';

composeMappingTemplate([
  ['key', '"value"'],
  ['key2', '123'],
  ['key3', 'true'],
]);
```

will produce:

```json
{
  "key": "value",
  "key2": 123,
  "key3": true
}
```

## `#if` directive

### Simgle `#if`

```ts
import { composeMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [
      ['key', '"value"'],
      ['key2', '123'],
      ['key3', 'true'],
    ],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value",
  "key2": 123,
  "key3": true
#end
}
```

### `#if` followed by a property

```ts
import { composeMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
  ),
  ['key2', '123'],
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value",
#end
  "key2": 123
}
```

### `#if` following a property

```ts
import { composeMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ['key', '"value"'],
  ifThen(
    '$input.params("flag") == "on"',
    [
      ['key2', '123'],
      ['key3', 'true'],
    ],
  ),
]);
```

will produce:

```json
{
  "key": "value"
#if ($input.params("flag") == "on")
  ,"key2": 123,
  "key3": true
#end
}
```

### Consecutive `#if`

```ts
import { composeMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
  ),
  ifThen(
    '$input.json("$.page") > 1',
    [['key2', '123']],
  ),
  ifThen(
    '$input.params("date") != ""',
    [['key3', 'true']],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value"
#end
#if ($input.json("$.page") > 1)
#if ($input.params("flag") == "on")
  ,
#end
  "key2": 123
#end
#if ($input.params("date") != "")
#if (($input.params("flag") == "on") || ($input.json("$.page") > 1))
  ,
#end
  "key3": true
#end
}
```

### Nested `#if`

```ts
import { composeMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [
      ifThen(
        '$input.json("$.page") > 1',
        [['key', '"value"']],
      ),
    ],
  ),
  ifThen(
    '$input.params("date") != ""',
    [['key2', '123']]
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
#if ($input.json("$.page") > 1)
  "key": "value"
#end
#end
#if ($input.params("date") != "")
#if (($input.params("flag") == "on") && ($input.json("$.page") > 1))
  ,
#end
  "key2": 123
#end
}
```

### Nested `#if` 2

```ts
import { componentMappingTemplate, ifThen } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
  ),
  ifThen(
    '$input.json("$.page") > 1',
    [ifThen(
      '$input.params("date") != ""',
      [['key2', '123']],
    )],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value"
#end
#if ($input.json("$.page") > 1)
#if ($input.params("date") != "")
#if ($input.params("flag") == "on")
  ,
#end
  "key2": 123
#end
#end
}
```

## `#if`-`#else` directive

### Simple `#if`-`#else`

```ts
import { composeMappingTemplate, ifThenElse } from 'mapping-template-compose';

composeMappingTemplate([
  ifThenElse(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
    [['key2', '123']],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value"
#else
  "key2": 123
#end
}
```

### `#if`-`#else` followed by a property

```ts
import { composeMappingTemplate, ifThenElse } from 'mapping-template-compose';

composeMappingTemplate([
  ifThenElse(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
    [['key2', '123']],
  ),
  ['key3', 'true'],
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value",
#else
  "key2": 123,
#end
  "key3": 'true'
}
```

### `#if`-`#else` following a property

```ts
import { composeMappingTemplate, ifThenElse } from 'mapping-template-compose';

composeMappingTemplate([
  ['key', '"value"'],
  ifThenElse(
    '$input.params("flag") == "on"',
    [['key2', '123']],
    [['key3', 'true']],
  ),
]);
```

will produce:

```json
{
  "key": "value",
#if ($input.params("flag") == "on")
  "key2": 123
#else
  "key3": true
#end
}
```

### `#if`-`#else` nesting `#if` and followed by `#if`

```ts
import { composeMappingTemplate, ifThen, ifThenElse } from 'mapping-template-compose';

composeMappingTemplate([
  ifThenElse(
    '$input.params("flag") == "on"',
    [ifThen(
      '$input.json("page") > 1',
      [['key', '"value"']],
    )],
    [ifThen(
      '$input.params("date") != ""',
      [['key2', '123']],
    )],
  ),
  ifThen(
    '$input.json("amount") > 1000',
    [['key3', 'true']],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
#if ($input.json("page") > 1)
  "key": "value"
#end
#else
#if ($input.params("date") != "")
  "key2": 123
#end
#end
#if ($input.json("amount") > 1000)
#if ((($input.params("flag") == "on") && ($input.json("page") > 1)) || ((!($input.params("flag") == "on")) && ($input.params("date") != "")))
  ,
#end
  "key3": true
#end
}
```

### `#if`-`#else` nesting `#if` and following `#if`

```ts
import { composeMappingTemplate, ifThen, ifThenElse } from 'mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("flag") == "on"',
    [['key', '"value"']],
  ),
  ifThenElse(
    '$input.json("page") > 1',
    [ifThen(
      '$input.params("date") != ""',
      [['key2', '123']],
    )],
    [ifThen(
      '$input.json("amount") > 1000',
      [['key3', 'true']],
    )],
  ),
]);
```

will produce:

```json
{
#if ($input.params("flag") == "on")
  "key": "value"
#end
#if ($input.json("page") > 1)
#if ($input.params("date") != "")
#if ($input.params("flag") == "on")
  ,
#end
  "key2": 123
#end
#else
#if ($input.json("amount") > 1000)
#if ($input.params("flag") == "on")
  ,
#end
  "key3": true
#end
#end
}
```