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
 *   "true" if a trailing comma is always necessary,
 *   "false" if a trailing comma is never necessary.
 *
 * @beta
 */
export function getCommaConditionAfterItem(item: MappingTemplateItem): string {
  if (isKeyValue(item)) {
    return 'true';
  }
  return getCommaConditionAfterIfBlock(item);
}

/**
 * Returns the condition in which a trailing comma is necessary after a given
 * {@link IfBlock}.
 *
 * @remarks
 *
 * ORs conditions of the then- and else-blocks.
 *
 * The condition of the then-block:
 * - ORs conditions of all the items in the then-block
 * - ANDs the above with the condition of `ifBlock`
 *
 * The condition of the else-block:
 * - ORs conditions of all the items in the else-block
 * - ANDS the above with the negated condition of `ifBlock`
 *
 * @returns
 *
 *   "true" if a trailing comma is always necessary,
 *   "false" if a trailing comma is never necessary.
 *
 * @beta
 */
export function getCommaConditionAfterIfBlock(ifBlock: IfBlock): string {
  const { condition, elseBlock, thenBlock } = ifBlock;
  let thenSubcondition: string;
  if (thenBlock.length > 0) {
    thenSubcondition = orConditions(
      ...thenBlock.map(i => getCommaConditionAfterItem(i)),
    );
  } else {
    thenSubcondition = 'false';
  }
  let elseSubcondition: string;
  if (elseBlock != null && elseBlock.length > 0) {
    elseSubcondition = orConditions(
      ...elseBlock.map(i => getCommaConditionAfterItem(i)),
    );
  } else {
    elseSubcondition = 'false';
  }
  if ((thenSubcondition === 'true') && (elseSubcondition === 'true')) {
    return 'true'; // (A || !A) → true
  }
  return orConditions(
    andConditions(condition, thenSubcondition),
    andConditions(`!(${condition})`, elseSubcondition),
  );
}

// ORs conditions.
//
// "false" if `conditions` is empty.
export function orConditions(...conditions: string[]): string {
  if (conditions.indexOf('true') !== -1) {
    return 'true';
  }
  conditions = conditions.filter(c => c != 'false');
  if (conditions.length === 0) {
    return 'false';
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return conditions
    .map(c => `(${c})`)
    .join(' || ');
}

// ANDs conditions.
//
// "true" if `conditions` is empty.
function andConditions(...conditions: string[]): string {
  if (conditions.indexOf('false') !== -1) {
    return 'false';
  }
  conditions = conditions.filter(c => c != 'true');
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
