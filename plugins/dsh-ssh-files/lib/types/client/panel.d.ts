/**
 * SshFilesPanel: the details-column occupant this plugin registers. The panel
 * shows and drives the state of the conversation it is mounted on — its
 * working mode (local / SSH), its remembered server, and its own live
 * connection — so separate conversations never share a server preference or
 * channel. It browses the active filesystem in a lazy tree and reads/writes
 * text files in a built-in editor. The panel auto-opens the column is not its
 * job: ui-conversation's inspect gesture opens it, and this plugin's own
 * registration wins the column the moment it is open.
 */
import type { SshFilesPanelProps } from './contract.ts';
/** The details panel. */
export declare function SshFilesPanel(props: SshFilesPanelProps): import("react").JSX.Element;
//# sourceMappingURL=panel.d.ts.map