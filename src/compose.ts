import { MappingTemplateContext } from './context';
import { type MappingTemplateItem, isKeyValue } from './items';

/**
 * Composes a mapping template for Amazon API Gateway.
 *
 * @remarks
 *
 * This function is intended to compose a mapping template that generates a
 * JSON object.
 *
 * You have to represent a key-value pair (field, or property) in a JSON object
 * as a two-element array `[key, value]` (see {@link KeyValue}).
 * When they are rendered in a JSON object,
 * `key` is surrounded with double quotation marks ("),
 * but `value` is left as-is.
 *
 * @beta
 */
export function composeMappingTemplate(items: MappingTemplateItem[]): string {
  const context = new MappingTemplateContext();
  _composeMappingTemplate(items, context);
  return context.toJson();
}

function _composeMappingTemplate(
  items: MappingTemplateItem[],
  context: MappingTemplateContext,
) {
  for (const item of items) {
    if (isKeyValue(item)) {
      const [key, value] = item;
      context.appendKeyValue(key, value);
    } else {
      // IfBlock
      context.enterIfBlock(item);
      _composeMappingTemplate(item.thenBlock, context);
      context.leaveBlock();
    }
  }
}
