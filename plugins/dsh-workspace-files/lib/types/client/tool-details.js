import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ToolDetails: the "tools" tab inspector. Reads the conversation snapshot
 * directly — the shared chat-store selection belongs to ui-conversation,
 * whose DetailsPanel this plugin shadows — and lists every tool call
 * materialized in the current window. Selecting one shows its input and
 * output; output renders as plain text/JSON (the tool-specific
 * `conversation.details.tool` renderers stay bound to the shadowed
 * DetailsPanel's declaration, so they are not re-rendered here).
 */
import { useMemo, useState } from 'react';
import { CodeBlock } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './WorkspaceFilesPanel.module.css';
/** Collect every root tool call materialized in the current window. */
function collectToolCalls(snapshot) {
    const out = [];
    for (const node of snapshot.chat.nodes.values()) {
        if (node.kind === 'tool-call') {
            const root = node.data.root;
            out.push(root);
        }
    }
    return out;
}
/** Display name of a call: the settled call's name when present, else its id. */
function displayName(call) {
    return 'kind' in call ? (call.call?.name ?? call.callId) : call.name;
}
/** Pretty-print a raw JSON args string, falling back to verbatim text. */
function pretty(raw) {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    }
    catch {
        // Not JSON (streaming fragment or plain text): show verbatim.
        return raw;
    }
}
/** Flatten a settled result's content into display text. */
function rawResultText(block) {
    const parts = block.content.map(item => item.type === 'text' ? item.text : JSON.stringify(item, null, 2));
    if (parts.length === 0 && block.error !== undefined)
        parts.push(`${block.error.name}: ${block.error.code}`);
    return parts.join('\n');
}
/** One selected call's input/output body. */
function ToolCallDetail({ block, t }) {
    const settled = 'kind' in block;
    const name = displayName(block);
    const argsRaw = settled ? block.call?.argsRaw ?? null : block.argsRaw;
    return (_jsxs("div", { className: css.toolDetail, children: [_jsx("div", { className: css.toolDetailTitle, children: name }), argsRaw !== null && (_jsxs("section", { className: css.section, children: [_jsx("div", { className: css.sectionLabel, children: t('tool.args') }), _jsx(CodeBlock, { code: pretty(argsRaw), lang: "json", copyLabel: t('copy'), copiedLabel: t('copied') })] })), _jsxs("section", { className: css.section, children: [_jsx("div", { className: css.sectionLabel, children: t('tool.output') }), settled
                        ? (_jsx("pre", { className: css.code, "data-error": block.isError || undefined, children: rawResultText(block) }))
                        : _jsx("div", { className: css.empty, children: t('tool.running') })] })] }));
}
/** The tools tab: a call list on top, the selected call's body below. */
export function ToolDetails({ useSession, t }) {
    const snapshot = useSession(s => s);
    const calls = useMemo(() => collectToolCalls(snapshot), [snapshot]);
    const [selectedId, setSelectedId] = useState(null);
    const selected = calls.find(call => call.callId === selectedId) ?? null;
    return (_jsxs("div", { className: css.toolBody, children: [calls.length === 0 && _jsx("div", { className: css.empty, children: t('tool.empty') }), calls.length > 0 && (_jsx("ul", { className: css.toolList, "aria-label": t('tool.listAria'), children: calls.map(call => (_jsx("li", { children: _jsxs("button", { type: "button", className: selectedId === call.callId ? `${css.toolItem} ${css.toolItemActive}` : css.toolItem, "aria-label": t('tool.callAria', { name: displayName(call) }), onClick: () => { setSelectedId(call.callId); }, children: [_jsx("span", { className: css.toolStatus, "data-running": !('kind' in call) || undefined }), _jsx("span", { className: css.toolName, children: displayName(call) })] }) }, call.callId))) })), selected !== null && _jsx(ToolCallDetail, { block: selected, t: t })] }));
}
//# sourceMappingURL=tool-details.js.map