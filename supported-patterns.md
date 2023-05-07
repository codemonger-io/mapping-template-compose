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

composeMappingTemplate(
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
);
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