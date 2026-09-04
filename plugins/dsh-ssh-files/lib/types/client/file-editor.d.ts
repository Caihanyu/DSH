/**
 * FileEditor: the panel's read/write editor for one text file on the active
 * filesystem. Loads the content through the injected `read`, edits in a
 * plain textarea, and persists through `write` (temp + rename on the host).
 * A dirty close asks for confirmation instead of discarding silently.
 */
import type { SshFilesTranslate } from './contract.ts';
/** Props the panel passes to the editor. */
export interface FileEditorProps {
    /** Absolute path of the file being edited. */
    path: string;
    /** Read one text file on the active filesystem. */
    read: (path: string, signal?: AbortSignal) => Promise<string>;
    /** Write one text file on the active filesystem. */
    write: (path: string, content: string) => Promise<void>;
    /** Close the editor (the panel owns dirty confirmation via the host). */
    onClose: () => void;
    /** Localized copy. */
    t: SshFilesTranslate;
}
/** The editor. */
export declare function FileEditor({ path, read, write, onClose, t }: FileEditorProps): import("react").JSX.Element;
//# sourceMappingURL=file-editor.d.ts.map