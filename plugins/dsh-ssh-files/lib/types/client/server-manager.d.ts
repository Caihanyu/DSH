/**
 * ServerManager: two modals — the server list (edit / delete / add) and the
 * add-or-edit form. The form collects name, host, port, username,
 * authentication strategy (password / private key / agent), and the initial
 * directory; the host validates and persists records.
 */
import type { SshFilesTranslate, SshServer, SshServerInput } from './contract.ts';
/** Props the server manager needs. */
export interface ServerManagerProps {
    /** Whether the modal is open. */
    open: boolean;
    /** Close the manager (the form modal owns its own state). */
    onClose: () => void;
    /** Saved server records. */
    servers: SshServer[];
    /** The id of the server the panel is connected to (or null). */
    activeServerId: string | null;
    /** Add a server record. */
    addServer: (input: SshServerInput) => Promise<void>;
    /** Replace one server record's fields. */
    updateServer: (id: string, input: SshServerInput) => Promise<void>;
    /** Remove one server record. */
    removeServer: (id: string) => Promise<void>;
    /** Localized copy. */
    t: SshFilesTranslate;
}
/** The server list manager with add/edit/delete. */
export declare function ServerManager({ open, onClose, servers, activeServerId, addServer, updateServer, removeServer, t, }: ServerManagerProps): import("react").JSX.Element;
//# sourceMappingURL=server-manager.d.ts.map