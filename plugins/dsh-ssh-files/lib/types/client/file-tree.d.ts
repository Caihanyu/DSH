/**
 * FileTree: the panel's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open the editor through `onOpenFile`.
 * A per-row menu offers local-mode desktop openers (VS Code / MarkText /
 * default app), create-in-directory, and delete. A leading ".." row navigates
 * to the parent directory, so the tree is not confined to its root.
 */
import type { SshFileEntry, SshFilesTranslate, SshListing } from './contract.ts';
/** Props the panel passes to the tree. */
export interface FileTreeProps {
    /** Absolute root of the tree (session cwd in local mode, server root in ssh mode). */
    root: string;
    /** List one directory level on the active filesystem. */
    list: (path: string, signal?: AbortSignal) => Promise<SshListing>;
    /** The working mode: local rows get desktop openers, ssh rows do not. */
    mode: 'local' | 'ssh';
    /** Open a file in the panel's editor. */
    onOpenFile: (path: string) => void;
    /** Open the create-file/dir modal for one directory. */
    onCreate: (dirPath: string, kind: 'file' | 'dir') => void;
    /** Request deletion of one entry. */
    onDelete: (entry: SshFileEntry) => void;
    /** Open a local file in a desktop app (local mode only). */
    onOpenLocal: (path: string, app: 'code' | 'marktext' | 'default') => Promise<void>;
    /** Localized copy. */
    t: SshFilesTranslate;
}
/** The file tree: parent row plus recursive entries under the root. */
export declare function FileTree({ root, list, mode, onOpenFile, onCreate, onDelete, onOpenLocal, t }: FileTreeProps): import("react").JSX.Element;
//# sourceMappingURL=file-tree.d.ts.map