import { composeMappingTemplate } from '../src/compose';
import type { KeyValue, MappingTemplateItem } from '../src/items';
import { ifThen } from '../src/items';

describe('composeMappingTemplate', () => {
  it('should convert a key-value pair into an object field', () => {
    const keyValue: KeyValue = ['key', '"value"'];
    expect(composeMappingTemplate([keyValue])).toEqual(
`{
  "key": "value"
}`,
    );
  });

  it('should indent the value of a key-value if it is consisting of multiple lines', () => {
    const value =
`{
  "key": "value"
}`;
    const items: MappingTemplateItem[] = [
      ['key', value]
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
  "key": {
    "key": "value"
  }
}`,
    );
  });

  it('should convert three key-value pairs into three object fields', () => {
    const items: MappingTemplateItem[] = [
      ['key', '"value"'],
      ['number', '123'],
      ['boolean', 'true'],
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
  "key": "value",
  "number": 123,
  "boolean": true
}`,
    );
  });

  it('should convert a ifThen block into a #if-#end block (single field)', () => {
    const ifBlock = ifThen(
      '$input.params("username") != ""',
      [['key', '"value"']],
    );
    expect(composeMappingTemplate([ifBlock])).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#end
}`,
    );
  });

  it('should convert a ifThen block into a #if-#end block (three fields)', () => {
    const ifBlock = ifThen(
      '$input.params("username") != ""',
      [
        ['key', '"value"'],
        ['number', '123'],
        ['boolean', 'true'],
      ],
    );
    expect(composeMappingTemplate([ifBlock])).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value",
  "number": 123,
  "boolean": true
#end
}`,
    );
  });

  it('should append a trailing comma to an ifThen block followed by a key-value pair', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [['key', '"value"']],
      ),
      ['number', '123'],
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value",
#end
  "number": 123
}`,
    );
  });

  it('should prepend a leading comma to an ifThen block with a single key-value pair following a key-value pair', () => {
    const items: MappingTemplateItem[] = [
      ['key', '"value"'],
      ifThen(
        '$input.params("username") != ""',
        [['number', '123']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
  "key": "value"
#if ($input.params("username") != "")
  ,"number": 123
#end
}`,
    );
  });

  it('should prepend a leading comma to an ifThen block with three key-value pairs following a key-value pair', () => {
    const items: MappingTemplateItem[] = [
      ['key', '"value"'],
      ifThen(
        '$input.params("username") != ""',
        [
          ['number', '123'],
          ['boolean', 'true'],
          ['array', '[1, 2, 3]'],
        ],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
  "key": "value"
#if ($input.params("username") != "")
  ,"number": 123,
  "boolean": true,
  "array": [1, 2, 3]
#end
}`,
    );
  });

  it('should conditionally prepend a leading comma to an ifThen block with a single key-value pair following another ifThen block', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [['key', '"value"']],
      ),
      ifThen(
        '$input.json("$.flag") == "on"',
        [['number', '123']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#end
#if ($input.json("$.flag") == "on")
#if ($input.params("username") != "")
  ,
#end
  "number": 123
#end
}`,
    );
  });

  it('should conditionally prepend a leading comma to an ifThen block with three key-value paris following another ifThen block', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [['key', '"value"']],
      ),
      ifThen(
        '$input.json("$.flag") == "on"',
        [
          ['number', '123'],
          ['boolean', 'true'],
          ['array', '[1, 2, 3]'],
        ],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#end
#if ($input.json("$.flag") == "on")
#if ($input.params("username") != "")
  ,
#end
  "number": 123,
  "boolean": true,
  "array": [1, 2, 3]
#end
}`,
    );
  });

  it('should OR conditions of preceding ifThen blocks to determine if a comma is necessary (single key-value pair)', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [['key', '"value"']],
      ),
      ifThen(
        '$input.json("$.flag") == "on"',
        [['number', '123']],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [['boolean', 'true']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#end
#if ($input.json("$.flag") == "on")
#if ($input.params("username") != "")
  ,
#end
  "number": 123
#end
#if ($input.params("page") == "1")
#if (($input.params("username") != "") || ($input.json("$.flag") == "on"))
  ,
#end
  "boolean": true
#end
}`,
    );
  });

  it('should OR conditions of preceding ifThen blocks to determine if a comma is necessary (three key-value pairs)', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [['key', '"value"']],
      ),
      ifThen(
        '$input.json("$.flag") == "on"',
        [['number', '123']],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [
          ['boolean', 'true'],
          ['array', '[1, 2, 3]'],
          ['object', '{"key": "value"}'],
        ],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#end
#if ($input.json("$.flag") == "on")
#if ($input.params("username") != "")
  ,
#end
  "number": 123
#end
#if ($input.params("page") == "1")
#if (($input.params("username") != "") || ($input.json("$.flag") == "on"))
  ,
#end
  "boolean": true,
  "array": [1, 2, 3],
  "object": {"key": "value"}
#end
}`,
    );
  });

  it('should convert a nested ifThen block in another ifThen block into an #if-#end block nested in another #if-#end block', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [
          ifThen(
            '$input.json("$.flag") == "on"',
            [
              ['key', '"value"'],
              ['number', '123'],
              ['boolean', 'true'],
            ],
          ),
        ],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
#if ($input.json("$.flag") == "on")
  "key": "value",
  "number": 123,
  "boolean": true
#end
#end
}`,
    );
  });

  it('should AND conditions of preceding nested ifThen blocks to determine a comma is necessary (single key-value pair)', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [
          ifThen(
            '$input.json("$.flag") == "on"',
            [['key', '"value"']],
          ),
        ],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [['number', '123']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
#if ($input.json("$.flag") == "on")
  "key": "value"
#end
#end
#if ($input.params("page") == "1")
#if (($input.params("username") != "") && ($input.json("$.flag") == "on"))
  ,
#end
  "number": 123
#end
}`,
    );
  });

  it('should AND conditions of preceding nested ifThen blocks to determine a comma is necessary (three key-value pairs)', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [
          ifThen(
            '$input.json("$.flag") == "on"',
            [['key', '"value"']],
          ),
        ],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [
          ['number', '123'],
          ['boolean', 'true'],
          ['array', '[1, 2, 3]'],
        ],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
#if ($input.json("$.flag") == "on")
  "key": "value"
#end
#end
#if ($input.params("page") == "1")
#if (($input.params("username") != "") && ($input.json("$.flag") == "on"))
  ,
#end
  "number": 123,
  "boolean": true,
  "array": [1, 2, 3]
#end
}`,
    );
  });

  it('should not AND the condition of a nested ifThen block followed by a key-value pair', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [
          ifThen(
            '$input.json("$.flag") == "on"',
            [['key', '"value"']],
          ),
          ['number', '123'],
        ],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [['boolean', 'true']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
#if ($input.json("$.flag") == "on")
  "key": "value",
#end
  "number": 123
#end
#if ($input.params("page") == "1")
#if ($input.params("username") != "")
  ,
#end
  "boolean": true
#end
}`,
    );
  });

  it('should ADD the condition of a nested ifThen block following a key-value pair', () => {
    const items: MappingTemplateItem[] = [
      ifThen(
        '$input.params("username") != ""',
        [
          ['key', '"value"'],
          ifThen(
            '$input.json("$.flag") == "on"',
            [['number', '123']],
          ),
        ],
      ),
      ifThen(
        '$input.params("page") == "1"',
        [['boolean', 'true']],
      ),
    ];
    expect(composeMappingTemplate(items)).toEqual(
`{
#if ($input.params("username") != "")
  "key": "value"
#if ($input.json("$.flag") == "on")
  ,"number": 123
#end
#end
#if ($input.params("page") == "1")
#if (($input.params("username") != "") && ($input.json("$.flag") == "on"))
  ,
#end
  "boolean": true
#end
}`,
    );
  });
});
