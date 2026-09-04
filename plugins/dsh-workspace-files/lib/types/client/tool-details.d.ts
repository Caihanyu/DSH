/**
 * ToolDetails: the "tools" tab inspector. Reads the conversation snapshot
 * directly — the shared chat-store selection belongs to ui-conversation,
 * whose DetailsPanel this plugin shadows — and lists every tool call
 * materialized in the current window. Selecting one shows its input and
 * output; output renders as plain text/JSON (the tool-specific
 * `conversation.details.tool` renderers stay bound to the shadowed
 * DetailsPanel's declaration, so they are not re-rendered here).
 */
import type { UseConversationSession } from '@deepseek-ai/dsh-client-runtime/client';
import type { WorkspaceFilesTranslate } from './contract.ts';
/** Props the panel passes to the tools inspector. */
export interface ToolDetailsProps {
    /** Session-scope conversation selector hook (framework standard kit). */
    useSession: UseConversationSession;
    /** Localized copy. */
    t: WorkspaceFilesTranslate;
}
/** The tools tab: a call list on top, the selected call's body below. */
export declare function ToolDetails({ useSession, t }: ToolDetailsProps): import("react").JSX.Element;
//# sourceMappingURL=tool-details.d.ts.map