import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

const DOCS_DIR = path.join(process.cwd(), "..", "..", "docs");

function stripGfmAlerts(md: string): string {
  return md
    .split("\n")
    .filter((line) => !/^>\s*\[!(WARNING|NOTE|TIP|IMPORTANT|CAUTION)\]/i.test(line))
    .join("\n");
}

export async function loadDocAsHtml(filename: string): Promise<string> {
  const fullPath = path.join(DOCS_DIR, filename);
  const raw = await readFile(fullPath, "utf-8");
  const cleaned = stripGfmAlerts(raw);
  const withoutH1 = cleaned.replace(/^#\s+.+$/m, "").trimStart();
  return marked.parse(withoutH1) as string;
}
