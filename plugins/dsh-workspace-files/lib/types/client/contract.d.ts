/**
 * Contract types for the workspace-files details panel: the inject face the
 * plugin supplies to its registration and the component's composed props.
 */
import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
/** The namespace-bound translate seat used by every panel subcomponent. */
export type WorkspaceFilesTranslate = TranslateNS<'workspace-files'>;
/** One file or directory row (the host's wire type, browser-safe mirror). */
export interface WorkspaceFilesEntry {
    /** Base name shown in the tree row. */
    name: string;
    /** Absolute host path — the client never joins path segments itself. */
    path: string;
    /** Directory or file. */
    kind: 'dir' | 'file';
    /** Hidden by the host platform's convention (dot-prefixed on POSIX); the client owns whether to show it. */
    hidden: boolean;
}
/** One listed directory level. */
export interface WorkspaceFilesListing {
    /** Absolute path of the listed directory. */
    path: string;
    /** Direct children, directories first, each group name-sorted. */
    entries: WorkspaceFilesEntry[];
}
/** The details-panel inject face: layout orchestration plus the file openers. */
export interface WorkspaceFilesInjected {
    /** Open the details column (layout orchestration). */
    openDetails: () => void;
    /** Close the details column (layout orchestration). */
    closeDetails: () => void;
    /** List one directory level with file/directory kinds through the `/workspace-files` channel. */
    list: (path: string, signal?: AbortSignal) => Promise<WorkspaceFilesListing>;
    /** Open a path with the operating system's default application. */
    openPath: (path: string) => Promise<void>;
    /** Open a path in VS Code (the configured `code` executable). */
    openInCode: (path: string) => Promise<void>;
    /** Open a path in MarkText (the configured `marktext` executable). */
    openInMarktext: (path: string) => Promise<void>;
}
/** Composed props of the workspace-files details panel. */
export type WorkspaceFilesPanelProps = PropsRuntime<'details'> & PropsLocale<'workspace-files'> & WorkspaceFilesInjected;
//# sourceMappingURL=contract.d.ts.map