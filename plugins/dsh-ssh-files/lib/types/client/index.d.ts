import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SshFilesKey } from './locales.ts';
export type { SshAuth, SshFileEntry, SshFilesInjected, SshFilesPanelProps, SshListing, SshMode, SshPanelState, SshServer, SshServerInput, SshStateResponse, } from './contract.ts';
export type { SshFilesKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The ssh-files details panel copy. */
        'ssh-files': SshFilesKey;
    }
}
/**
 * Required services (cordis fiber inject): the slot registry, the layout
 * panel face, the workspaces runtime (default-app open), the connection
 * transport, and the locale service.
 */
export declare const inject: string[];
/**
 * Register the mode-switching file panel once the layout's `details`
 * declaration is on the ledger. The inject face closes over `ctx`, so the
 * RPC calls stay live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map