import {
  type MappingTemplateItem,
  getCommaConditionAfterItem,
  ifThen,
  ifThenElse,
  isKeyValue,
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

  it('should return ANDed conditions for nested if-then blocks', () => {
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

  it('should return ANDed conditions for an if-then block containing another if-then block following a key-value pair', () => {
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
      '($input.params("username") != "") && ($input.json("$.flag") == "on")',
    );
  });
});
