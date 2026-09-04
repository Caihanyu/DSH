import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FileTree: the files tab's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open through the extension-routed
 * primary opener (Markdown → MarkText, code → VS Code, everything else →
 * the default app) or through the per-row "open with…" menu. Hidden
 * dot-entries are filtered client-side behind a toggle.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDownOutline14, IconChevronRightOutline14, IconCloseOutline16, IconEllipsisOutline16, IconFolderClose16, IconFolderOpen16, IconRefreshOutline14, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './WorkspaceFilesPanel.module.css';
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd']);
const CODE_EXTENSIONS = new Set([
    '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.py', '.pyw',
    '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.json', '.jsonc', '.json5',
    '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.editorconfig',
    '.html', '.htm', '.xhtml', '.css', '.scss', '.less', '.sass', '.vue', '.svelte',
    '.rs', '.go', '.java', '.kt', '.c', '.h', '.cpp', '.hpp', '.cc', '.cs',
    '.sql', '.xml', '.svg', '.php', '.rb', '.swift', '.lua', '.pl', '.r', '.dart',
    '.ex', '.exs', '.erl', '.hs', '.scala', '.groovy', '.dockerfile', '.tf',
]);
/** Extension-less build/ignore/editor files whose content is code, not prose. */
const CODE_BASENAMES = new Set([
    'dockerfile', 'makefile', 'justfile', 'gnumakefile',
    '.gitignore', '.gitattributes', '.gitmodules', '.dockerignore', '.npmrc',
    '.yarnrc', '.pypirc', '.eslintrc', '.prettierrc', 'license', 'copying',
]);
/** Lower-cased extension of a base name (empty when it has none). */
function extensionOf(name) {
    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot).toLowerCase();
}
/** File presentation category: drives the primary opener and the row glyph. */
function fileKindOf(name) {
    const ext = extensionOf(name);
    if (MARKDOWN_EXTENSIONS.has(ext))
        return 'markdown';
    if (CODE_EXTENSIONS.has(ext))
        return 'code';
    const lower = name.toLowerCase();
    // `.env` and its per-environment twins (`.env.local`, `.env.example`) are
    // configuration code; extension-less build files open in the editor too.
    if (lower.startsWith('.env') || CODE_BASENAMES.has(lower))
        return 'code';
    return 'other';
}
/** Small colored document glyph keyed by the file's presentation category. */
function FileGlyph({ kind }) {
    const color = kind === 'markdown'
        ? 'var(--dsw-alias-state-info-primary, #3b82f6)'
        : kind === 'code'
            ? 'var(--dsw-alias-state-success-primary, #22c55e)'
            : 'var(--dsw-alias-label-tertiary, #94a3b8)';
    return (_jsxs("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": true, className: css.fileGlyph, children: [_jsx("path", { d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z", fill: color, opacity: "0.18" }), _jsx("path", { d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z", fill: "none", stroke: color, strokeWidth: "1.1" }), _jsx("path", { d: "M9 1.5v3.5h3.5", fill: "none", stroke: color, strokeWidth: "1.1" })] }));
}
/**
 * The file tree. Owns all tree state (loaded levels, expansion, hidden
 * toggle, the open menu, and in-flight open feedback); renders recursively.
 */
export function FileTree({ root, list, openPath, openInCode, openInMarktext, t }) {
    const [levels, setLevels] = useState({});
    const [expanded, setExpanded] = useState({ [root]: true });
    const [loading, setLoading] = useState({});
    const [errors, setErrors] = useState({});
    const [showHidden, setShowHidden] = useState(false);
    const [menuPath, setMenuPath] = useState(null);
    const [busyPath, setBusyPath] = useState(null);
    const [failure, setFailure] = useState(null);
    const aborters = useRef(new Map());
    const ensureLoaded = (path) => {
        setLoading(prev => (prev[path] === true ? prev : { ...prev, [path]: true }));
        setErrors((prev) => {
            if (prev[path] === undefined)
                return prev;
            const { [path]: _dropped, ...rest } = prev;
            return rest;
        });
        const controller = new AbortController();
        aborters.current.set(path, controller);
        void list(path, controller.signal).then((level) => {
            if (controller.signal.aborted)
                return;
            aborters.current.delete(path);
            setLevels(prev => ({ ...prev, [path]: level }));
            setLoading((prev) => {
                const { [path]: _dropped, ...rest } = prev;
                return rest;
            });
        }, (reason) => {
            if (controller.signal.aborted)
                return;
            aborters.current.delete(path);
            setLoading((prev) => {
                const { [path]: _dropped, ...rest } = prev;
                return rest;
            });
            setErrors(prev => ({
                ...prev,
                [path]: reason instanceof Error ? reason.message : String(reason),
            }));
        });
    };
    // Load the root level on mount (and again when the root path changes).
    useEffect(() => { ensureLoaded(root); }, [root]);
    const toggle = (path) => {
        setExpanded(prev => ({ ...prev, [path]: prev[path] !== true }));
        if (expanded[path] !== true)
            ensureLoaded(path);
    };
    const refresh = () => {
        for (const controller of aborters.current.values())
            controller.abort();
        aborters.current.clear();
        setLevels({});
        setErrors({});
        setLoading({});
        setExpanded({ [root]: true });
        setMenuPath(null);
        setFailure(null);
        ensureLoaded(root);
    };
    const runOpen = (entry, opener) => {
        setBusyPath(entry.path);
        setFailure(null);
        void opener(entry.path).then(() => { setBusyPath(null); }, (reason) => {
            setBusyPath(null);
            setFailure({ path: entry.path, message: reason instanceof Error ? reason.message : String(reason) });
        });
    };
    const primaryOpener = (entry) => {
        if (entry.kind === 'dir')
            return null;
        const kind = fileKindOf(entry.name);
        if (kind === 'markdown')
            return openInMarktext;
        if (kind === 'code')
            return openInCode;
        return openPath;
    };
    const primaryLabel = (entry) => {
        const kind = fileKindOf(entry.name);
        if (kind === 'markdown')
            return t('file.openMarktext');
        if (kind === 'code')
            return t('file.openCode');
        return t('file.openDefault');
    };
    const renderLevel = (path, depth) => {
        const level = levels[path];
        const isLoading = loading[path] === true;
        const error = errors[path];
        const pad = { paddingLeft: depth * 14 + 10 };
        if (error !== undefined) {
            return (_jsxs(Fragment, { children: [_jsxs("div", { className: css.row, style: pad, children: [_jsx("span", { className: css.errorText, children: t('tree.error') }), _jsx("button", { type: "button", className: css.inlineButton, onClick: () => { ensureLoaded(path); }, children: t('tree.retry') })] }), _jsx("div", { className: css.rowError, style: pad, children: error })] }, path));
        }
        if (level === undefined) {
            return isLoading
                ? _jsx("div", { className: css.row, style: pad, children: t('tree.loading') }, path)
                : null;
        }
        const visible = level.entries.filter(entry => !entry.hidden || showHidden);
        if (visible.length === 0) {
            return _jsx("div", { className: css.row, style: pad, children: t('tree.empty') }, path);
        }
        return (_jsx(Fragment, { children: visible.map((entry) => {
                if (entry.kind === 'dir') {
                    const open = expanded[entry.path] === true;
                    return (_jsxs(Fragment, { children: [_jsxs("div", { className: css.row, style: pad, "data-dir": true, role: "button", tabIndex: 0, "aria-expanded": open, title: entry.path, onClick: () => { toggle(entry.path); }, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggle(entry.path);
                                } }, children: [open ? _jsx(IconChevronDownOutline14, { className: css.chevron }) : _jsx(IconChevronRightOutline14, { className: css.chevron }), open ? _jsx(IconFolderOpen16, { className: css.folderIcon }) : _jsx(IconFolderClose16, { className: css.folderIcon }), _jsx("span", { className: css.rowName, children: entry.name })] }), open && renderLevel(entry.path, depth + 1)] }, entry.path));
                }
                const primary = primaryOpener(entry);
                return (_jsxs(Fragment, { children: [_jsxs("div", { className: css.row, style: pad, "data-file": true, title: `${entry.path}\n${primaryLabel(entry)}`, onClick: () => { if (primary !== null)
                                runOpen(entry, primary); }, children: [_jsx("span", { className: css.rowSpacer }), _jsx(FileGlyph, { kind: fileKindOf(entry.name) }), _jsx("span", { className: css.rowName, children: entry.name }), _jsx("button", { type: "button", className: css.rowMenu, "aria-label": t('file.menuAria', { name: entry.name }), title: t('file.menuAria', { name: entry.name }), onClick: (e) => {
                                        e.stopPropagation();
                                        setMenuPath(menuPath === entry.path ? null : entry.path);
                                    }, children: _jsx(IconEllipsisOutline16, {}) })] }), menuPath === entry.path && (_jsxs("div", { className: css.openMenu, style: { paddingLeft: depth * 14 + 34 }, children: [_jsx("button", { type: "button", className: css.menuItem, onClick: () => { setMenuPath(null); runOpen(entry, openInCode); }, children: t('file.openCode') }), _jsx("button", { type: "button", className: css.menuItem, onClick: () => { setMenuPath(null); runOpen(entry, openInMarktext); }, children: t('file.openMarktext') }), _jsx("button", { type: "button", className: css.menuItem, onClick: () => { setMenuPath(null); runOpen(entry, openPath); }, children: t('file.openDefault') })] }))] }, entry.path));
            }) }, path));
    };
    const rootName = useMemo(() => {
        const trimmed = root.endsWith('/') || root.endsWith('\\') ? root.slice(0, -1) : root;
        const sep = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
        return sep === -1 ? trimmed : trimmed.slice(sep + 1);
    }, [root]);
    return (_jsxs("div", { className: css.tree, children: [_jsxs("div", { className: css.treeToolbar, children: [_jsx("span", { className: css.treeRoot, title: root, children: rootName || root }), _jsx("button", { type: "button", className: css.iconButton, "aria-label": t('refresh'), title: t('refresh'), onClick: () => { refresh(); }, children: _jsx(IconRefreshOutline14, {}) }), _jsx("button", { type: "button", className: css.iconButton, "aria-pressed": showHidden, title: showHidden ? t('tree.hideHidden') : t('tree.showHidden'), onClick: () => { setShowHidden(prev => !prev); }, children: _jsx(IconCloseOutline16, {}) })] }), _jsxs("div", { className: css.treeBody, children: [renderLevel(root, 0), busyPath !== null && _jsx("div", { className: css.row, children: t('tree.loading') })] }), failure !== null && (_jsxs("div", { className: css.actionError, children: [_jsx("span", { className: css.actionErrorText, children: t('action.failed', { message: failure.message }) }), _jsx("button", { type: "button", className: css.inlineButton, onClick: () => {
                            const path = failure.path;
                            setFailure(null);
                            runOpen({ name: path, path, kind: 'file', hidden: false }, openPath);
                        }, children: t('action.fallback') })] }))] }));
}
//# sourceMappingURL=files-tree.js.map