import {
  type MappingTemplateItem,
  andCommaConditions,
  getCommaConditionAfterItem,
  ifThen,
  ifThenElse,
  isKeyValue,
  orCommaConditions,
} from '../src/items';

describe('isKeyValue', () => {
  it('should be true for ["key", ""value""]', () => {
    expect(isKeyValue(['key', '"value"'])).toBe(true);
  });

  it('should be false for "key: value"', () => {
    expect(isKeyValue('key: value')).toBe(false);
  });

  it('should be false for ["key"]', () => {
    expect(isKeyValue(['key'])).toBe(false);
  });

  it('should be false for ["key", ""value"", "extra"]', () => {
    expect(isKeyValue(['key', '"value"', 'extra'])).toBe(false);
  });

  it('should be false for [123, ""value""]', () => {
    expect(isKeyValue([123, '"value"'])).toBe(false);
  });

  it('should be false for ["key", 123]', () => {
    expect(isKeyValue(['key', 123])).toBe(false);
  });
});

describe('ifThen', () => {
  it('should build an `IfBlock` without the else-block', () => {
    const condition = '$input.params("username") != ""';
    const thenBlock: MappingTemplateItem[] = [['key', '"value"']];
    expect(ifThen(condition, thenBlock)).toEqual({
      blockType: 'if-block',
      condition,
      thenBlock,
    });
  });
});

describe('ifThenElse', () => {
  it('should build an `IfBlock` with the then- and else-blocks', () => {
    const condition = '$input.params("username") != ""';
    const thenBlock: MappingTemplateItem[] = [['key', '"value"']];
    const elseBlock: MappingTemplateItem[] = [['key2', '123']];
    expect(ifThenElse(condition, thenBlock, elseBlock)).toEqual({
      blockType: 'if-block',
      condition,
      thenBlock,
      elseBlock,
    });
  });
});

describe('orCommaConditions', () => {
  it('should return "(condition1) || (condition2) || (condition3)" for ["condition1", "condition2", "condition3"]', () => {
    expect(orCommaConditions('condition1', 'condition2', 'condition3'))
      .toEqual('(condition1) || (condition2) || (condition3)');
  });

  it('should return "condition" for "condition"', () => {
    expect(orCommaConditions('condition')).toEqual('condition');
  });

  it('should return "false" for empty input', () => {
    expect(orCommaConditions()).toEqual('false');
  });

  it('should return "(condition1) || (condition2)" for ["false", "condition1", "condtion2"]', () => {
    expect(orCommaConditions('false', 'condition1', 'condition2'))
      .toEqual('(condition1) || (condition2)');
  });

  it('should return "(condition1) || (condition2)" for ["condition1", "condtion2", "false"]', () => {
    expect(orCommaConditions('condition1', 'condition2', 'false'))
      .toEqual('(condition1) || (condition2)');
  });

  it('should return "false" for ["false", "false", "false"]', () => {
    expect(orCommaConditions('false', 'false', 'false')).toEqual('false');
  });

  it('should return "true" for ["true", "condition1", "condition2"]', () => {
    expect(orCommaConditions('true', 'condition1', 'condition2'))
      .toEqual('true');
  });

  it('should return "true" for ["condition1", "condition2", "true"]', () => {
    expect(orCommaConditions('condition1', 'condition2', 'true'))
      .toEqual('true');
  });
});

describe('andCommaConditions', () => {
  it('should return "(condition1) && (condition2) && (condition3)" for ["condition1", "condition2", "condition3"]', () => {
    expect(andCommaConditions('condition1', 'condition2', 'condition3'))
      .toEqual('(condition1) && (condition2) && (condition3)');
  });

  it('should return "condition" for "condition"', () => {
    expect(andCommaConditions('condition')).toEqual('condition');
  });

  it('should return "true" for empty input', () => {
    expect(andCommaConditions()).toEqual('true');
  });

  it('should return "(condition1) && (condition2)" for ["true", "condition1", "condition2"]', () => {
    expect(andCommaConditions('true', 'condition1', 'condition2'))
      .toEqual('(condition1) && (condition2)');
  });

  it('should return "(condition1) && (condition2)" for ["condition1", "condition2", "true"]', () => {
    expect(andCommaConditions('condition1', 'condition2', 'true'))
      .toEqual('(condition1) && (condition2)');
  });

  it('should return "true" for ["true", "true", "true"]', () => {
    expect(andCommaConditions('true', 'true', 'true')).toEqual('true');
  });

  it('should return "false" for ["false", "condition1", "condition2"]', () => {
    expect(andCommaConditions('false', 'condition1', 'condition2'))
      .toEqual('false');
  });

  it('should return "false" for ["condition1", "condition2", "false"]', () => {
    expect(andCommaConditions('condition1', 'condition2', 'false'))
      .toEqual('false');
  });
});

describe('getCommaConditionAfterItem', () => {
  it('should return "true" for a key-value pair', () => {
    const item: MappingTemplateItem = ['key', 'value'];
    expect(getCommaConditionAfterItem(item)).toEqual('true');
  });

  it('should return the condition for an if-then block containing only a key-value pair', () => {
    const item: MappingTemplateItem = ifThen(
      '$input.params("username") != ""',
      [['key', '"value"']],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '$input.params("username") != ""',
    );
  });

  it('should AND conditions of nesting and nested if-then blocks', () => {
    const item: MappingTemplateItem = ifThen(
      '$input.params("username") != ""',
      [
        ifThen(
          '$input.json("$.flag") == "on"',
          [['number', '123']],
        ),
      ],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '($input.params("username") != "") && ($input.json("$.flag") == "on")',
    );
  });

  it('should return only the top-level condition for an if-then block containing another if-then block followed by a key-value pair', () => {
    const item: MappingTemplateItem = ifThen(
      '$input.params("username") != ""',
      [
        ifThen(
          '$input.json("$.flag") == "on"',
          [['number', '123']],
        ),
        ['boolean', 'true'],
      ],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '$input.params("username") != ""',
    );
  });

  it('should return only the top-level condition for an if-then block containing another if-then block following a key-value pair', () => {
    const item: MappingTemplateItem = ifThen(
      '$input.params("username") != ""',
      [
        ['number', '123'],
        ifThen(
          '$input.json("$.flag") == "on"',
          [['boolean', 'true']],
        ),
      ],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '$input.params("username") != ""',
    );
  });

  it('should OR conditions of nested if-then blocks, and AND them with the condition of the nesting if-then block', () => {
    const item: MappingTemplateItem = ifThen(
      '$input.params("username") != ""',
      [
        ifThen(
          '$input.json("$.flag") == "on"',
          [['key', '"value"']],
        ),
        ifThen(
          '$input.params("page") == "1"',
          [['number', '123']],
        ),
      ],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '($input.params("username") != "") && (($input.json("$.flag") == "on") || ($input.params("page") == "1"))',
    );
  });

  it('should return "true" for an if-then-else block that contains only key-value pairs', () => {
    const item: MappingTemplateItem = ifThenElse(
      '$input.params("username") != ""',
      [['key', '"value"']],
      [['number', '123']],
    );
    expect(getCommaConditionAfterItem(item)).toEqual('true');
  });

  it('should AND the condition of a nesting if-then-else block and the condition of an if-then block nested in the then-part, and OR it with the negated condition of the nesting if-then-else block', () => {
    const item: MappingTemplateItem = ifThenElse(
      '$input.params("username") != ""',
      [ifThen(
        '$input.json("$.flag") == "on"',
        [['key', '"value"']],
      )],
      [['number', '123']],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '(($input.params("username") != "") && ($input.json("$.flag") == "on")) || (!($input.params("username") != ""))',
    );
  });

  it('should AND the negated condition of a nesting if-then-else block and the condition of an if-then block nested in the else-part, and OR it with the condition of the nesting if-then-else block', () => {
    const item: MappingTemplateItem = ifThenElse(
      '$input.params("username") != ""',
      [['key', '"value"']],
      [ifThen(
        '$input.json("$.flag") == "on"',
        [['number', '123']],
      )],
    );
    expect(getCommaConditionAfterItem(item)).toEqual(
      '($input.params("username") != "") || ((!($input.params("username") != "")) && ($input.json("$.flag") == "on"))',
    );
  });
});
