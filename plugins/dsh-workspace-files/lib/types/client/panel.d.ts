/**
 * WorkspaceFilesPanel: the details-column occupant this plugin registers.
 * A tabbed panel — "Files" (the workspace file tree, rooted at the current
 * session's working directory) and "Tools" (the tool-call inspector). The
 * panel auto-opens the column is not its job: ui-conversation's inspect
 * gesture opens it, and this plugin's own registration wins the column the
 * moment it is open.
 */
import type { WorkspaceFilesPanelProps } from './contract.ts';
/** Full composed props: the details runtime share, the locale seat, and the inject face. */
export type PanelProps = WorkspaceFilesPanelProps;
/** The tabbed details panel. */
export declare function WorkspaceFilesPanel(props: WorkspaceFilesPanelProps): import("react").JSX.Element;
//# sourceMappingURL=panel.d.ts.map