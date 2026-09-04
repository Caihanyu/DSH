import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type WorkspaceFilesKey } from './locales.ts';
export type { WorkspaceFilesEntry, WorkspaceFilesInjected, WorkspaceFilesListing, WorkspaceFilesPanelProps, } from './contract.ts';
export type { WorkspaceFilesKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The workspace-files details panel copy. */
        'workspace-files': WorkspaceFilesKey;
    }
}
/**
 * Required services (cordis fiber inject): the slot registry, the layout
 * panel face, the workspaces runtime (default-app open), the connection
 * transport, and the locale service.
 */
export declare const inject: string[];
/**
 * Register the tabbed details panel once the layout's `details` declaration
 * is on the ledger. The inject face closes over `ctx`, so the openers stay
 * live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map