/**
 * FileTree: the files tab's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open through the extension-routed
 * primary opener (Markdown → MarkText, code → VS Code, everything else →
 * the default app) or through the per-row "open with…" menu. Hidden
 * dot-entries are filtered client-side behind a toggle.
 */
import type { WorkspaceFilesTranslate } from './contract.ts';
/** Props the panel passes to the tree: the injected openers plus the root path. */
export interface FileTreeProps {
    /** Absolute workspace root of the current session. */
    root: string;
    /** List one directory level through the `/workspace-files` channel. */
    list: (path: string, signal?: AbortSignal) => Promise<import('./contract.ts').WorkspaceFilesListing>;
    /** Open a path with the operating system's default application. */
    openPath: (path: string) => Promise<void>;
    /** Open a path in VS Code (the configured `code` executable). */
    openInCode: (path: string) => Promise<void>;
    /** Open a path in MarkText (the configured `marktext` executable). */
    openInMarktext: (path: string) => Promise<void>;
    /** Localized copy. */
    t: WorkspaceFilesTranslate;
}
/**
 * The file tree. Owns all tree state (loaded levels, expansion, hidden
 * toggle, the open menu, and in-flight open feedback); renders recursively.
 */
export declare function FileTree({ root, list, openPath, openInCode, openInMarktext, t }: FileTreeProps): import("react").JSX.Element;
//# sourceMappingURL=files-tree.d.ts.map