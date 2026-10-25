export type EmphasizedWord = { text: string; emphasis: boolean };
export function titleWords(title: string): string[];
export function pickEmphasisWord(title: string, seed?: string): number;
export function emphasizeTitle(title: string, seed?: string): EmphasizedWord[];
