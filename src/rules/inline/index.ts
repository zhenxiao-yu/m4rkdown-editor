import { Block, InlineBlock } from "@/core/tokenizer";

import parseEmphasis from "./emphasis";
import parseLink from "./link";
import parseText from "./text";

/**
 * Processes inline blocks within a given block.
 * This function iterates over all tokens in the block, finds `inline_block` tokens,
 * and applies inline parsing rules to generate child tokens for those blocks.
 *
 * @param {Block} block - The block containing tokens to process.
 */
export function parseInlineBlock(block: Block) {
  const blockTokens = block.tokens;

  // Iterate over tokens in the block
  blockTokens.forEach(tok => {
    if (tok.type === "inline_block") {
      // Create a new InlineBlock instance for the token's content
      let state = new InlineBlock(tok.content);

      // Parse the inline content using the inline parsing rules
      parseInline(state);

      // Assign the generated tokens as children of the current token
      tok.children = state.tokens;
    }
  });
}

/**
 * Parses inline text in an InlineBlock and returns the generated tokens.
 *
 * @param {InlineBlock} block - The inline block containing text to process.
 * @returns {Array} - The tokens generated from parsing the inline text.
 */
export function parseInlineText(block: InlineBlock) {
  parseInline(block); // Apply inline parsing rules
  return block.tokens; // Return the resulting tokens
}

/**
 * Applies inline parsing rules to the given state.
 * This function uses a set of rules (e.g., emphasis, links) to process
 * inline content and generate appropriate tokens.
 *
 * @param {InlineBlock} state - The inline block to process.
 */
const parseInline = (state: InlineBlock) => {
  // Start with plain text parsing to split content into manageable segments
  parseText(state);

  // Define inline parsing rules (e.g., emphasis, links)
  const parseRules = [parseEmphasis, parseLink /* Add other inline parsing rules here */];

  // Apply each parsing rule in sequence
  for (const rule of parseRules) {
    if (rule(state)) {
      return; // Exit early if a rule successfully processes the content
    }
  }
};
