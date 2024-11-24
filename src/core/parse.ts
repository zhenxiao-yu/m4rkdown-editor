import parseBlock from "@/rules/block";
import { parseInlineBlock } from "@/rules/inline";

import { Block } from "./tokenizer";

/**
 * Parses a Block object by first processing block-level structures
 * and then refining it into inline-level elements.
 *
 * @param {Block} block - The block structure to parse, containing text and delimiters.
 */
function parse(block: Block): void {
  // Process block-level elements until all content is parsed
  while (block.pos < block.posMax) {
    parseBlock(block); // Parse the current block and update block position
  }

  // Once block parsing is complete, process inline-level elements
  parseInlineBlock(block);
}

export default parse;
