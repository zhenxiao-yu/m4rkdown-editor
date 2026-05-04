export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportMarkdown(content: string, title: string): void {
    downloadFile(content, `${title}.md`, 'text/markdown;charset=utf-8');
}

export function exportHtml(html: string, title: string): void {
    const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #333; }
  h1, h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
  code { background: #f4f4f4; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 1em; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding: 0.5em 1em; color: #666; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5em 0.75em; }
  th { background: #f4f4f4; }
  img { max-width: 100%; }
  a { color: #0070f3; }
</style>
</head>
<body>
${html}
</body>
</html>`;
    downloadFile(full, `${title}.html`, 'text/html;charset=utf-8');
}
