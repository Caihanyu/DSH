import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FileTree: the panel's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open the editor through `onOpenFile`.
 * A per-row menu offers local-mode desktop openers (VS Code / MarkText /
 * default app), create-in-directory, and delete. A leading ".." row navigates
 * to the parent directory, so the tree is not confined to its root.
 */
import { useMemo, useState } from 'react';
import { IconChevronDownOutline14, IconChevronRightOutline14, IconEllipsisOutline16, IconFolderClose16, IconRefreshOutline14, Menu, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './SshFilesPanel.module.css';
/** Parent of an absolute path, tolerant of both `/` and `\` separators. */
function parentOf(path) {
    const trimmed = path.replace(/[\\/]+$/, '');
    const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
    if (index <= 0)
        return path; // filesystem root: parent is itself
    return trimmed.slice(0, index);
}
/** Small colored document glyph keyed by the row kind. */
function FileGlyph({ kind }) {
    return kind === 'dir'
        ? _jsx(IconFolderClose16, { className: css.dirGlyph })
        : (_jsxs("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": true, className: css.fileGlyph, children: [_jsx("path", { d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z", fill: "var(--dsw-alias-label-tertiary, #94a3b8)", opacity: "0.18" }), _jsx("path", { d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z", fill: "none", stroke: "var(--dsw-alias-label-tertiary, #94a3b8)", strokeWidth: "1.1" }), _jsx("path", { d: "M9 1.5v3.5h3.5", fill: "none", stroke: "var(--dsw-alias-label-tertiary, #94a3b8)", strokeWidth: "1.1" })] }));
}
/** The recursive row: one entry with expansion/actions. */
function TreeRow({ entry, depth, list, mode, showHidden, onOpenFile, onCreate, onDelete, onOpenLocal, t, }) {
    const [children, setChildren] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const toggle = async () => {
        if (entry.kind !== 'dir') {
            onOpenFile(entry.path);
            return;
        }
        if (expanded) {
            setExpanded(false);
            return;
        }
        setExpanded(true);
        if (children !== null)
            return;
        setLoading(true);
        setError(null);
        try {
            const listing = await list(entry.path);
            setChildren(listing.entries);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setLoading(false);
        }
    };
    const menuItems = useMemo(() => {
        const items = [];
        if (entry.kind === 'dir') {
            items.push({ id: 'new-file', label: t('tree.newFile') }, { id: 'new-dir', label: t('tree.newDir') });
        }
        if (mode === 'local') {
            items.push({ id: 'open-code', label: t('tree.openCode') }, { id: 'open-marktext', label: t('tree.openMarktext') }, { id: 'open-default', label: t('tree.openDefault') });
        }
        items.push({ id: 'delete', label: t('tree.delete'), danger: true });
        return items;
    }, [entry.kind, mode, t]);
    const onMenuSelect = (id) => {
        setMenuOpen(false);
        switch (id) {
            case 'new-file':
                onCreate(entry.path, 'file');
                break;
            case 'new-dir':
                onCreate(entry.path, 'dir');
                break;
            case 'open-code':
                void onOpenLocal(entry.path, 'code');
                break;
            case 'open-marktext':
                void onOpenLocal(entry.path, 'marktext');
                break;
            case 'open-default':
                void onOpenLocal(entry.path, 'default');
                break;
            case 'delete':
                onDelete(entry);
                break;
        }
    };
    const visibleChildren = showHidden
        ? (children ?? [])
        : (children ?? []).filter(child => !child.hidden);
    return (_jsxs("div", { children: [_jsxs("div", { className: `${css.treeRow} ${entry.kind === 'dir' ? css.treeRowDir : css.treeRowFile}`, "data-kind": entry.kind, style: { paddingLeft: `${8 + depth * 14}px` }, role: "treeitem", "aria-expanded": entry.kind === 'dir' ? expanded : undefined, children: [_jsx("button", { type: "button", className: css.treeChevron, "aria-hidden": true, tabIndex: -1, onClick: () => { void toggle(); }, children: entry.kind === 'dir'
                            ? (loading
                                ? _jsx("span", { className: css.loadingDot })
                                : expanded ? _jsx(IconChevronDownOutline14, {}) : _jsx(IconChevronRightOutline14, {}))
                            : null }), _jsxs("button", { type: "button", className: css.treeLabel, onClick: () => { void toggle(); }, title: entry.path, children: [_jsx(FileGlyph, { kind: entry.kind }), _jsx("span", { className: css.treeName, children: entry.name })] }), _jsx(Menu, { open: menuOpen, onClose: () => { setMenuOpen(false); }, items: menuItems, onSelect: onMenuSelect, align: "end", portal: true, anchor: (_jsx("button", { type: "button", className: css.iconButton, "aria-haspopup": "menu", "aria-expanded": menuOpen, "aria-label": entry.name, onClick: () => { setMenuOpen(true); }, children: _jsx(IconEllipsisOutline16, {}) })) })] }), expanded && (_jsxs("div", { role: "group", children: [error !== null && (_jsxs("div", { className: css.treeError, style: { paddingLeft: `${24 + depth * 14}px` }, children: [t('tree.error'), "\uFF1A", error] })), visibleChildren.map(child => (_jsx(TreeRow, { entry: child, depth: depth + 1, list: list, mode: mode, showHidden: showHidden, onOpenFile: onOpenFile, onCreate: onCreate, onDelete: onDelete, onOpenLocal: onOpenLocal, t: t }, child.path))), visibleChildren.length === 0 && error === null && (_jsx("div", { className: css.treeEmpty, style: { paddingLeft: `${24 + depth * 14}px` }, children: t('tree.empty') }))] }))] }));
}
/** The file tree: parent row plus recursive entries under the root. */
export function FileTree({ root, list, mode, onOpenFile, onCreate, onDelete, onOpenLocal, t }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [showHidden, setShowHidden] = useState(false);
    const [parentMenu, setParentMenu] = useState(false);
    const [failure, setFailure] = useState(null);
    // The root row lives here so a refresh remounts only the top level.
    const rootEntry = { name: root, path: root, kind: 'dir', hidden: false };
    const parent = parentOf(root);
    const handleOpenLocal = (path, app) => {
        setFailure(null);
        const action = app === 'code'
            ? onOpenLocal(path, 'code')
            : app === 'marktext' ? onOpenLocal(path, 'marktext') : onOpenLocal(path, 'default');
        return action.catch((error) => {
            setFailure({ path, message: error instanceof Error ? error.message : String(error) });
        });
    };
    return (_jsxs("div", { className: css.treeRoot, children: [_jsxs("div", { className: css.treeToolbar, children: [_jsx("button", { type: "button", className: css.toolbarButton, onClick: () => { setRefreshKey(value => value + 1); }, title: t('tree.refresh'), "aria-label": t('tree.refresh'), children: _jsx(IconRefreshOutline14, {}) }), _jsx("button", { type: "button", className: css.toolbarButton, onClick: () => { setShowHidden(value => !value); }, title: showHidden ? t('tree.hideHidden') : t('tree.showHidden'), children: showHidden ? t('tree.showHidden') : t('tree.hideHidden') })] }), failure !== null && (_jsx("div", { className: css.treeError, role: "alert", children: t('tree.openFailed', { message: failure.message }) })), _jsxs("div", { role: "tree", "aria-label": root, className: css.tree, children: [_jsx("div", { className: css.treeRow, "data-kind": "dir", style: { paddingLeft: '8px' }, children: _jsx(Menu, { open: parentMenu, onClose: () => { setParentMenu(false); }, items: [
                                { id: 'new-file', label: t('tree.newFile') },
                                { id: 'new-dir', label: t('tree.newDir') },
                            ], onSelect: (id) => {
                                setParentMenu(false);
                                if (id === 'new-file')
                                    onCreate(parent, 'file');
                                if (id === 'new-dir')
                                    onCreate(parent, 'dir');
                            }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.treeLabel, onClick: () => { setParentMenu(true); }, title: t('tree.parent'), children: [_jsx("span", { className: css.parentLabel, children: ".." }), _jsx("span", { className: css.treeName, children: t('tree.parent') })] })) }) }), _jsx(TreeRow, { entry: rootEntry, depth: 0, list: list, mode: mode, showHidden: showHidden, onOpenFile: onOpenFile, onCreate: onCreate, onDelete: onDelete, onOpenLocal: handleOpenLocal, t: t }, `${root}-${refreshKey}`)] })] }));
}
//# sourceMappingURL=file-tree.js.map