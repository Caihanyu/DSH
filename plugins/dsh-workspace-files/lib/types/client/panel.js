import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WorkspaceFilesPanel: the details-column occupant this plugin registers.
 * A tabbed panel — "Files" (the workspace file tree, rooted at the current
 * session's working directory) and "Tools" (the tool-call inspector). The
 * panel auto-opens the column is not its job: ui-conversation's inspect
 * gesture opens it, and this plugin's own registration wins the column the
 * moment it is open.
 */
import { useEffect, useState } from 'react';
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import { FileTree } from "./files-tree.js";
import { ToolDetails } from "./tool-details.js";
import css from './WorkspaceFilesPanel.module.css';
/** The tabbed details panel. */
export function WorkspaceFilesPanel(props) {
    const { useSessions, useSession, sessionId, t, openDetails, closeDetails, list, openPath, openInCode, openInMarktext, } = props;
    // Session workspace root: the file tree's base. An omitted cwd (blank
    // session) renders the empty state rather than a fabricated root.
    const cwd = useSessions(store => store.byId[sessionId]?.cwd);
    const [tab, setTab] = useState('files');
    // The column opens for the session that mounts this panel (the user asked
    // for the file browser beside every conversation); closing it keeps it
    // closed for that session, and the next session's remount opens it again.
    useEffect(() => { openDetails(); }, [openDetails]);
    return (_jsxs("div", { className: css.root, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.tabs, role: "tablist", "aria-label": t('panel.title'), children: [_jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'files', className: tab === 'files' ? `${css.tab} ${css.tabActive}` : css.tab, onClick: () => { setTab('files'); }, children: t('tab.files') }), _jsx("button", { type: "button", role: "tab", "aria-selected": tab === 'tool', className: tab === 'tool' ? `${css.tab} ${css.tabActive}` : css.tab, onClick: () => { setTab('tool'); }, children: t('tab.tool') })] }), _jsx("button", { type: "button", className: css.close, "aria-label": t('panel.close'), title: t('panel.close'), onClick: () => { closeDetails(); }, children: _jsx(IconCloseOutline16, {}) })] }), _jsx("div", { className: css.body, children: tab === 'files'
                    ? (cwd === undefined
                        ? _jsx("div", { className: css.empty, children: t('tree.empty') })
                        : (_jsx(FileTree, { root: cwd, list: list, openPath: openPath, openInCode: openInCode, openInMarktext: openInMarktext, t: t }, cwd)))
                    : _jsx(ToolDetails, { useSession: useSession, t: t }) })] }));
}
//# sourceMappingURL=panel.js.map