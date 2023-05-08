import { IfBlock, getCommaConditionAfterIfBlock, getCommaConditionAfterItem, orConditions } from './items';

/**
 * Pending block.
 *
 * @remarks
 *
 * A pending block represents a line, or a block of lines that is not finished
 * with a comma yet.
 */
interface PendingBlock {
  /**
   * Appends a key-value pair to this pending block.
   *
   * @throws Error
   *
   *   If this pending block is not open.
   */
  appendKeyValue(key: string, value: string): void;

  /**
   * Enters an `#if` block.
   *
   * @throws Error
   *
   *   If this pending block is not open.
   */
  enterIfBlock(definition: IfBlock): void;

  /**
   * Enters the `#else` block.
   *
   * @throws Error
   *
   *   If this pending block is not open,
   *   or if the last pending block in this pending block is not
   *   `IfDirectiveBlock`.
   */
  enterElseBlock(): void;

  /**
   * Leaves the last block.
   *
   * @throws Error
   *
   *   If there is no open block.
   */
  leaveBlock(): void;

  /**
   * Returns the context of the trailing comma.
   *
   * @returns
   *
   *   Context in which the trailing comma is necessary.
   */
  getCommaContext(): CommaContext;

  /** Renders this pending block. */
  render(options: PendingBlockRenderOptions): string[];

  /** Returns if this pending block is open. */
  isOpen(): boolean;

  /** Closes this pending block. */
  close(): void;
}

/**
 * Comma context.
 *
 * @remarks
 *
 * Provides the context in which a comma is necessary.
 */
type CommaContext =
  | CommaContextNever
  | CommaContextUnconditional
  | CommaContextConditional;

/** Comma context in which no comma is necessary. */
interface CommaContextNever {
  contextType: 'never';
}
const COMMA_CONTEXT_NEVER: CommaContext = { contextType: 'never' };

/** Comma context in which a comma is unconditionally necessary. */
interface CommaContextUnconditional {
  contextType: 'unconditional';
};
const COMMA_CONTEXT_UNCONDITIONAL: CommaContext = {
  contextType: 'unconditional',
};

/**
 * Comma context in which a comma is necessary if any of the conditions is
 * met.
 */
interface CommaContextConditional {
  contextType: 'conditional';
  /** Conditions in which a comma is necessary. */
  conditions: string[];
}

/** PendingBlock's rendering options. */
interface PendingBlockRenderOptions {
  /** Indent. */
  indent: string;
  /** Whether a trailing comma is appended. */
  trailingComma: boolean;
  /** Whether a leading comma is prepended. */
  leadingComma?: boolean;
}

/** Context of building a block. */
abstract class BlockContext implements PendingBlock {
  /** Lines already finished with a comma. */
  protected finishedLines: string[] = [];
  /** Pending blocks in this block. */
  protected pendingBlocks: PendingBlock[] = [];
  /** Whether this block is open. */
  protected _isOpen: boolean = true;

  constructor(
    protected indent: string,
    protected commaContext: CommaContext,
  ) {}

  appendKeyValue(key: string, value: string) {
    if (!this._isOpen) {
      throw new Error('block is not open');
    }
    const lastPendingBlock = this.lastPendingBlock;
    if (lastPendingBlock?.isOpen()) {
      lastPendingBlock.appendKeyValue(key, value);
    } else {
      this.finishWithTrailingComma();
      this.pendingBlocks.push(new KeyValueLine(key, value));
    }
  }

  enterIfBlock(definition: IfBlock) {
    if (!this._isOpen) {
      throw new Error('block is not open');
    }
    const lastPendingBlock = this.lastPendingBlock;
    if (lastPendingBlock?.isOpen()) {
      lastPendingBlock.enterIfBlock(definition);
    } else {
      let commaContext: CommaContext;
      if (getCommaConditionAfterIfBlock(definition) === 'true') {
        this.finishWithTrailingComma();
        commaContext = COMMA_CONTEXT_NEVER;
      } else{
        commaContext =
          this.lastPendingBlock?.getCommaContext() ?? COMMA_CONTEXT_NEVER;
      }
      if (commaContext.contextType === 'never') {
        commaContext = this.commaContext;
      }
      this.pendingBlocks.push(
        new IfDirectiveBlock(this.indent, definition, commaContext),
      );
    }
  }

  enterElseBlock() {
    if (!this._isOpen) {
      throw new Error('block is not open');
    }
    const lastPendingBlock = this.lastPendingBlock;
    if (lastPendingBlock == null) {
      throw new Error('no preceding if block');
    }
    if (lastPendingBlock.isOpen()) {
      lastPendingBlock.enterElseBlock();
    } else {
      if (!(lastPendingBlock instanceof IfDirectiveBlock)) {
        throw new Error('no preceding if block');
      }
      this.pendingBlocks.push(lastPendingBlock.createElseBlock());
    }
  }

  leaveBlock() {
    const lastPendingBlock = this.lastPendingBlock;
    if (lastPendingBlock?.isOpen()) {
      lastPendingBlock.leaveBlock();
    } else {
      if (!this.isOpen()) {
        throw new Error('no open block');
      }
      this.close();
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  close() {
    this._isOpen = false;
  }

  /** Last pending block in this block. */
  protected get lastPendingBlock(): PendingBlock | undefined {
    return this.pendingBlocks[this.pendingBlocks.length - 1];
  }

  /** Finishes the pending blocks with a trailing comma. */
  private finishWithTrailingComma() {
    let blocks = this.pendingBlocks;
    if (blocks.length > 0) {
      switch (this.commaContext.contextType) {
        case 'unconditional':
          {
            const [block, ...remaining] = blocks;
            const newLines = block.render({
              indent: this.indent,
              trailingComma: true,
              leadingComma: true,
            });
            this.finishedLines = this.finishedLines.concat(newLines);
            blocks = remaining;
            this.commaContext = COMMA_CONTEXT_NEVER;
          }
          break;
        case 'conditional':
          {
            let condition;
            if (this.commaContext.conditions.length === 1) {
              condition = this.commaContext.conditions[0];
            } else if (this.commaContext.conditions.length > 1) {
              condition = this.commaContext.conditions
                .map(c => `(${c})`)
                .join(' || ');
            } else {
              throw new Error('conditional comma context without conditions');
            }
            this.finishedLines.push(`#if (${condition})`);
            this.finishedLines.push(this.indent + ',');
            this.finishedLines.push(`#end`);
            this.commaContext = COMMA_CONTEXT_NEVER;
          }
          break;
        case 'never':
          break;
        default:
          const check: never = this.commaContext;
          throw new Error('unexpected comma context: ' + this.commaContext);
      }
    }
    for (const block of blocks) {
      const newLines = block.render({
        indent: this.indent,
        trailingComma: true,
      });
      this.finishedLines = this.finishedLines.concat(newLines);
    }
    this.pendingBlocks = [];
  }

  abstract getCommaContext(): CommaContext;
  abstract render(options: PendingBlockRenderOptions): string[];
}

/**
 * Context of building a mapping template.
 *
 * @beta
 */
export class MappingTemplateContext extends BlockContext {
  constructor() {
    super('  ', COMMA_CONTEXT_NEVER);
  }

  getCommaContext(): CommaContext {
    return COMMA_CONTEXT_NEVER; // should never be called, though
  }

  /** Renders a JSON object. */
  render(options: PendingBlockRenderOptions): string[] {
    let outputLines = [
      '{',
      ...this.finishedLines,
    ];
    for (const block of this.pendingBlocks) {
      const newLines = block.render(options);
      outputLines = outputLines.concat(newLines);
    }
    outputLines.push('}');
    return outputLines;
  }

  /** Outputs the JSON representation. */
  toJson(): string {
    const outputLines = this.render({
      indent: this.indent,
      trailingComma: false,
    });
    return outputLines.join('\n');
  }
}

/** Pending key-value line. */
class KeyValueLine implements PendingBlock {
  /** Initializes with a key-value pair. */
  constructor(public key: string, public value: string) {}

  appendKeyValue() {
    throw new Error('key-value pair is not open');
  }

  enterIfBlock(definition: IfBlock) {
    throw new Error('key-value pair is not open');
  }

  enterElseBlock() {
    throw new Error('key-value pair is not open');
  }

  leaveBlock() {
    throw new Error('key-value never contains an open block');
  }

  getCommaContext(): CommaContext {
    return COMMA_CONTEXT_UNCONDITIONAL;
  }

  /** Renders a property in a JSON object. */
  render({ indent, trailingComma, leadingComma }: PendingBlockRenderOptions):
    string[]
  {
    let field = `"${this.key}": ${this.renderValue(indent)}`;
    if (leadingComma) {
      field = ',' + field;
    }
    if (trailingComma) {
      field += ',';
    }
    return [indent + field];
  }

  /**
   * Renders the value.
   *
   * @remarks
   *
   * Indents other than the first line if the value is consisting of multiple
   * lines.
   */
  private renderValue(indent: string): string {
    let lines = this.value.split('\n');
    for (let i = 1; i < lines.length; ++i) {
      lines[i] = indent + lines[i];
    }
    return lines.join('\n');
  }

  /** Always closed. */
  isOpen(): boolean {
    return false;
  }

  /** Does nothing. */
  close() {}
}

/** Block starting with "#if". */
class IfDirectiveBlock extends BlockContext {
  /** Initializes with the block definition. */
  constructor(
    indent: string,
    public definition: IfBlock,
    commaContext: CommaContext,
  ) {
    super(indent, commaContext);
  }

  /** Condition of the if block. */
  get condition(): string {
    return this.definition.condition;
  }

  getCommaContext(): CommaContext {
    switch (this.commaContext.contextType) {
      case 'unconditional':
        return COMMA_CONTEXT_UNCONDITIONAL;
      case 'conditional':
        return {
          contextType: 'conditional',
          conditions: [
            ...this.commaContext.conditions,
            getCommaConditionAfterIfBlock(this.definition),
          ],
        };
      case 'never':
        {
          const condition = getCommaConditionAfterIfBlock(this.definition);
          if (condition === 'true') {
            return COMMA_CONTEXT_UNCONDITIONAL;
          }
          return {
            contextType: 'conditional',
            conditions: [condition],
          };
        }
      default:
        const check: never = this.commaContext;
        throw new Error(
          'unexpected comma context type: ' + this.commaContext,
        );
    }
  }

  protected getCommaContextOfPart(): CommaContext {
    let condition = orConditions(
      ...this.definition.thenBlock.map(i => getCommaConditionAfterItem(i)),
    );
    if (condition === 'true') {
      return COMMA_CONTEXT_UNCONDITIONAL;
    }
    return {
      contextType: 'conditional',
      conditions: [condition],
    };
  }

  /** Render the "#if" block. */
  render(options: PendingBlockRenderOptions): string[] {
    let renderedLines = [
      `#if (${this.condition})`,
      ...this.finishedLines,
    ];
    const newLines = this.renderPendingBlocks(options);
    renderedLines = renderedLines.concat(newLines);
    if (this.definition.elseBlock == null) {
      renderedLines.push('#end');
    }
    return renderedLines;
  }

  /** Renders the pending blocks. */
  renderPendingBlocks(options: PendingBlockRenderOptions): string[] {
    let renderedLines: string[] = [];
    let blocks = this.pendingBlocks;
    if (blocks.length > 0) {
      switch (this.commaContext.contextType) {
        case 'unconditional':
          {
            const [block, ...remaining] = blocks;
            const newLines = block.render({
              ...options,
              leadingComma: true,
            });
            renderedLines = renderedLines.concat(newLines);
            blocks = remaining;
          }
          break;
        case 'conditional':
          if (this.getCommaContextOfPart().contextType === 'unconditional') {
            let condition;
            if (this.commaContext.conditions.length === 1) {
              condition = this.commaContext.conditions[0];
            } else if (this.commaContext.conditions.length > 1) {
              condition = this.commaContext.conditions
                .map((c) => `(${c})`)
                .join(' || ');
            } else {
              throw new Error('conditional comma context without conditions');
            }
            renderedLines.push(`#if (${condition})`);
            renderedLines.push(options.indent + ',');
            renderedLines.push(`#end`);
          }
          break;
        case 'never':
          break;
        default:
          const check: never = this.commaContext;
          throw new Error(
            'unexpected comma context type: ' + this.commaContext,
          );
      }
    }
    for (const block of blocks) {
      const newLines = block.render(options);
      renderedLines = renderedLines.concat(newLines);
    }
    return renderedLines;
  }

  /** Creates the `#else` block of this `#if` block. */
  createElseBlock(): ElseDirectiveBlock {
    return new ElseDirectiveBlock(
      this.indent,
      this.definition,
      this.commaContext,
    );
  }
}

/** Block starting with `#else`. */
class ElseDirectiveBlock extends IfDirectiveBlock {
  /** Initializes with the block definition. */
  constructor(
    indent: string,
    definition: IfBlock,
    commaContext: CommaContext,
  ) {
    super(indent, definition, commaContext);
  }

  protected getCommaContextOfPart(): CommaContext {
    if (this.definition.elseBlock == null) {
      return COMMA_CONTEXT_NEVER;
    }
    let condition = orConditions(
      ...this.definition.elseBlock.map(i => getCommaConditionAfterItem(i)),
    );
    if (condition === 'true') {
      return COMMA_CONTEXT_UNCONDITIONAL;
    }
    return {
      contextType: 'conditional',
      conditions: [condition],
    };
  }

  /** Renders the `#else` block. */
  render(options: PendingBlockRenderOptions): string[] {
    let renderedLines = [
      `#else`,
      ...this.finishedLines,
    ];
    const newLines = this.renderPendingBlocks(options);
    renderedLines = renderedLines.concat(newLines);
    renderedLines.push('#end');
    return renderedLines;
  }
}
