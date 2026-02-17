import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ComponentEntry } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ComponentRegistry {
  private docsDir: string;
  private components: ComponentEntry[] = [];
  private docCache = new Map<string, string>();

  constructor(docsDir?: string) {
    this.docsDir = docsDir ?? join(__dirname, "docs");
  }

  init(): void {
    const indexPath = join(this.docsDir, "_index.json");
    const raw = readFileSync(indexPath, "utf-8");
    this.components = JSON.parse(raw) as ComponentEntry[];
  }

  getComponentList(): ComponentEntry[] {
    return this.components;
  }

  getComponentNames(): string[] {
    return this.components.map((c) => c.name);
  }

  getComponentDocs(name: string): string | null {
    const lower = name.toLowerCase();

    const cached = this.docCache.get(lower);
    if (cached) return cached;

    const entry = this.components.find(
      (c) => c.name.toLowerCase() === lower
    );
    if (!entry) return null;

    try {
      const mdPath = join(this.docsDir, `${entry.name}.md`);
      const content = readFileSync(mdPath, "utf-8");
      this.docCache.set(lower, content);
      return content;
    } catch {
      return null;
    }
  }
}
