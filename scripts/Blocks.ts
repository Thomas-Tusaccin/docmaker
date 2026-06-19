import type { Tokens } from 'marked';
// Interfaces

interface BaseBlock {
  id: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: number;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: string;
  language?: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  title?: string;
  index?: number;
  caption: string;
  width: number;
}

export interface AdmonitionBlock extends BaseBlock {
  type: "admonition";
  content: string;
  category: string;
  collapsible: boolean,
  expanded: boolean,
  title?: string;
}

export interface FormulaBlock extends BaseBlock {
  type: "formula";
  content: string;
  index?: number;
  caption?: string;
}

export interface LineBlock extends BaseBlock {
  type: "line";
}

export interface ListBlock extends BaseBlock {
  type: "list";
  items: ListItem[];
  ordered: boolean;
}

export interface ListItem extends BaseBlock {
  type: "listitem";
  items: ListItem[];
  content: string;
  ordered?: boolean;
}

export interface AbbreviationBlock extends BaseBlock {
  type: "abbreviation";
  abbreviation: string;
  meaning: string;
}

// Un bloc est SOIT l'un, SOIT l'autre
export type EditorBlock = ParagraphBlock | ImageBlock | HeadingBlock | CodeBlock | ImageBlock | AdmonitionBlock | FormulaBlock | LineBlock | ListBlock | ListItem | AbbreviationBlock;