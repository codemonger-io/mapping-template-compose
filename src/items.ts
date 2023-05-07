/**
 * Item constituting a mapping template.
 *
 * @beta
 */
export type MappingTemplateItem = KeyValue | IfBlock;

/**
 * Key-value pair.
 *
 * @remarks
 *
 * Represents a field, or property in a JSON object.
 * When a `KeyValue` is rendered in a JSON object,
 * `key` is surrounded with double quotation marks ("),
 * but `value` is left as-is.
 *
 * @beta
 */
export type KeyValue = [string, string];

/**
 * Returns if a given value is a {@link KeyValue}.
 *
 * @remarks
 *
 * If this function returns `true`, `item` is narrowed to {@link KeyValue}.
 *
 * @beta
 */
export function isKeyValue(item: any): item is KeyValue {
  if (!Array.isArray(item)) {
    return false;
  }
  if (item.length !== 2) {
    return false;
  }
  const [key, value] = item;
  if (typeof key !== 'string') {
    return false;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return true;
}

/**
 * If block.
 *
 * @remarks
 *
 * One of the following functions to instantiate an `IfBlock`.
 * - {@link ifThen}
 * - {@link ifThenElse}
 *
 * @beta
 */
export interface IfBlock {
  /** Always "if-block". */
  readonly blockType: 'if-block';
  /**
   * Condition of the `if`.
   * Do not include the directive; i.e., `#if`.
   */
  readonly condition: string;
  /** Block to be evaluated when the condition stands. */
  readonly thenBlock: MappingTemplateItem[];
  /** Block to be evaluated when the condition does not stand. */
  readonly elseBlock?: MappingTemplateItem[];
}

/**
 * Creates an `IfBlock` that has only the then-block.
 *
 * @beta
 */
export function ifThen(
  condition: string,
  thenBlock: MappingTemplateItem[],
): IfBlock {
  return {
    blockType: 'if-block',
    condition,
    thenBlock,
  };
}

/**
 * Creates an `IfBlock` that has then- and else-blocks.
 *
 * @beta
 */
export function ifThenElse(
  condition: string,
  thenBlock: MappingTemplateItem[],
  elseBlock: MappingTemplateItem[],
): IfBlock {
  return {
    blockType: 'if-block',
    condition,
    thenBlock,
    elseBlock,
  };
}

/**
 * Returns the condition in which a trailing comma is necessary after a given
 * item.
 *
 * @returns
 *
 *   "true" if a trailing comma is always necessary.
 *
 * @beta
 */
export function getCommaConditionAfterItem(item: MappingTemplateItem): string {
  if (isKeyValue(item)) {
    return 'true';
  }
  // ifBlock
  const { condition, thenBlock } = item;
  if (thenBlock.length > 0) {
    const lastItem = thenBlock[thenBlock.length - 1];
    return and(condition, getCommaConditionAfterItem(lastItem));
  }
  return condition;

  function and(...conditions: string[]): string {
    conditions = conditions.filter(c => c !== 'true');
    if (conditions.length === 0) {
      return 'true';
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return conditions
      .map(c => `(${c})`)
      .join(' && ');
  }
}
