export interface LintWarning {
    line: number;
    message: string;
    severity: 'warning' | 'error';
}

export function lintMarkdown(src: string): LintWarning[] {
    const lines = src.split('\n');
    const warns: LintWarning[] = [];

    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        const lineNum = i + 1;

        // Empty heading (e.g. "## ")
        if (/^#{1,6}\s*$/.test(ln)) {
            warns.push({ line: lineNum, message: 'Empty heading', severity: 'warning' });
        }

        // Heading without space after # (e.g. "#title")
        if (/^#{1,6}[^#\s]/.test(ln)) {
            warns.push({ line: lineNum, message: 'Heading missing space after #', severity: 'warning' });
        }

        // Broken image reference: ![alt]() — empty src
        if (/!\[[^\]]*\]\(\s*\)/.test(ln)) {
            warns.push({ line: lineNum, message: 'Image with empty src', severity: 'warning' });
        }

        // Broken link: [text]() — empty href
        if (/(?<!!)\[[^\]]*\]\(\s*\)/.test(ln)) {
            warns.push({ line: lineNum, message: 'Link with empty href', severity: 'warning' });
        }

        // Trailing spaces (more than 2, which is intentional line-break)
        if (/[^\s] {3,}$/.test(ln)) {
            warns.push({ line: lineNum, message: 'Excessive trailing whitespace', severity: 'warning' });
        }

        // Tabs in content (outside code blocks — simplified check)
        if (/\t/.test(ln) && !/^(\t|    )/.test(ln)) {
            warns.push({ line: lineNum, message: 'Tab character in text (use spaces)', severity: 'warning' });
        }
    }

    // Check for multiple H1s
    const h1Lines = lines.filter(l => /^# [^\s]/.test(l));
    if (h1Lines.length > 1) {
        warns.push({ line: 1, message: `Multiple H1 headings (${h1Lines.length} found) — use one per document`, severity: 'warning' });
    }

    // Unclosed fenced code block
    const fenceCount = lines.filter(l => /^```/.test(l)).length;
    if (fenceCount % 2 !== 0) {
        warns.push({ line: lines.length, message: 'Unclosed fenced code block (odd number of ``` markers)', severity: 'error' });
    }

    return warns.slice(0, 10); // cap at 10 warnings to avoid overwhelming
}
