import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconCloseOutline16, IconPlusOutline16, IconSettingsOutline14, IconWarningOutline16, Input, Menu, Modal, StateDot, } from '@deepseek-ai/dsh-client-ui-primitives';
import { FileEditor } from "./file-editor.js";
import { FileTree } from "./file-tree.js";
import { ServerManager } from "./server-manager.js";
import css from './SshFilesPanel.module.css';
/** Join a directory and a name with `/` (Node fs and SFTP both accept `/` on every platform). */
function joinPath(dir, name) {
    return dir.endsWith('/') || dir.endsWith('\\') ? dir + name : `${dir}/${name}`;
}
/** The details panel. */
export function SshFilesPanel(props) {
    const { useSessions, sessionId: sid, t, openDetails, closeDetails, getState, setMode, addServer, updateServer, removeServer, connect, disconnect, list, read, write, mkdir, unlink, openNewSessionOn, openLocalDefault, openLocalCode, openLocalMarktext, } = props;
    // Session workspace root: the local tree's base. An omitted cwd (blank
    // session) renders the empty state rather than a fabricated root.
    const cwd = useSessions(store => store.byId[sid]?.cwd);
    const [response, setResponse] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [connectingId, setConnectingId] = useState(null);
    const [connectError, setConnectError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [serverMenuOpen, setServerMenuOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [openFile, setOpenFile] = useState(null);
    const [createTarget, setCreateTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [newName, setNewName] = useState('');
    const [createBusy, setCreateBusy] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    // The column opens for the session that mounts this panel.
    useEffect(() => { openDetails(); }, [openDetails]);
    // Initial state load (abort-guarded) for THIS session.
    useEffect(() => {
        const controller = new AbortController();
        setLoadError(null);
        getState(sid, controller.signal).then(setResponse, (error) => {
            if (controller.signal.aborted)
                return;
            setLoadError(error instanceof Error ? error.message : String(error));
        });
        return () => { controller.abort(); };
    }, [getState, sid]);
    const mode = response?.state.mode ?? 'local';
    const connected = response?.state.connected ?? false;
    const activeServer = useMemo(() => response?.state.servers.find(server => server.id === response.state.serverId) ?? null, [response]);
    const selectedServer = useMemo(() => response?.state.servers.find(server => server.id === (selectedId ?? response.state.serverId)) ?? null, [response, selectedId]);
    /** Tree base: session cwd in local mode, the server root when connected. */
    const localRoot = cwd;
    const sshRoot = response?.root ?? null;
    const handleSetMode = async (next) => {
        if (next === mode)
            return;
        setOpenFile(null);
        setConnectError(null);
        try {
            setResponse(await setMode(sid, next));
        }
        catch (error) {
            setConnectError(error instanceof Error ? error.message : String(error));
        }
    };
    // Auto-reconnect once per mount: an SSH-mode session whose remembered server
    // is present reconnects without a click, so a new conversation opened on a
    // server arrives connected. A manual disconnect leaves it disconnected.
    const autoConnectTried = useRef(false);
    useEffect(() => {
        if (autoConnectTried.current)
            return;
        if (response === null || loadError !== null)
            return;
        const st = response.state;
        if (st.mode !== 'ssh' || st.serverId === null || st.connected)
            return;
        if (st.servers.find(candidate => candidate.id === st.serverId) === undefined)
            return;
        autoConnectTried.current = true;
        setConnectingId(st.serverId);
        void connect(sid, st.serverId).then(setResponse, (error) => {
            autoConnectTried.current = false;
            setConnectError(error instanceof Error ? error.message : String(error));
        }).finally(() => { setConnectingId(null); });
    }, [response, loadError, connect]);
    const handleConnect = async (id) => {
        setConnectingId(id);
        setConnectError(null);
        setOpenFile(null);
        try {
            setResponse(await connect(sid, id));
            setSelectedId(id);
        }
        catch (error) {
            setConnectError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setConnectingId(null);
        }
    };
    const handleDisconnect = async () => {
        setOpenFile(null);
        setConnectError(null);
        try {
            setResponse(await disconnect(sid));
        }
        catch (error) {
            setConnectError(error instanceof Error ? error.message : String(error));
        }
    };
    /** Open the current workspace's New-Session view defaulted to this server. */
    const handleNewSessionOn = async (serverId) => {
        setConnectError(null);
        try {
            await openNewSessionOn(serverId);
        }
        catch (error) {
            setConnectError(error instanceof Error ? error.message : String(error));
        }
    };
    const handleCreate = async () => {
        if (createTarget === null)
            return;
        const name = newName.trim();
        if (name === '')
            return;
        const target = joinPath(createTarget.dirPath, name);
        setCreateBusy(true);
        setCreateError(null);
        try {
            if (createTarget.kind === 'file') {
                await write(sid, target, '');
            }
            else {
                await mkdir(sid, target);
            }
            setCreateTarget(null);
            setNewName('');
        }
        catch (error) {
            setCreateError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setCreateBusy(false);
        }
    };
    const handleDelete = async () => {
        if (deleteTarget === null)
            return;
        setDeleteBusy(true);
        setDeleteError(null);
        try {
            await unlink(sid, deleteTarget.path);
            setDeleteTarget(null);
        }
        catch (error) {
            setDeleteError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setDeleteBusy(false);
        }
    };
    const openLocalAction = (app) => app === 'code'
        ? openLocalCode
        : app === 'marktext' ? openLocalMarktext : openLocalDefault;
    /** FileTree's per-row opener: choose the app from the row menu's id. */
    const handleOpenLocal = (path, app) => openLocalAction(app)(path);
    const serverMenuItems = (response?.state.servers ?? []).map(server => ({
        id: server.id,
        label: `${server.name}（${server.username}@${server.host}）`,
    }));
    return (_jsxs("div", { className: css.root, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.modeBar, role: "tablist", "aria-label": t('mode.tip'), children: [_jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'local', className: mode === 'local' ? `${css.modeTab} ${css.modeTabActive}` : css.modeTab, onClick: () => { void handleSetMode('local'); }, children: t('mode.local') }), _jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'ssh', className: mode === 'ssh' ? `${css.modeTab} ${css.modeTabActive}` : css.modeTab, onClick: () => { void handleSetMode('ssh'); }, children: t('mode.ssh') })] }), mode === 'ssh' && (_jsxs("div", { className: css.connBar, children: [connected && activeServer !== null ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: css.connInfo, children: [_jsx(StateDot, { state: "done" }), t('conn.connectedTo', { name: activeServer.name })] }), _jsx(Button, { variant: "outline", size: "sm", icon: _jsx(IconPlusOutline16, {}), title: t('conn.newSessionOn'), onClick: () => { void handleNewSessionOn(activeServer.id); }, children: t('conn.newSessionOn') }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => { void handleDisconnect(); }, children: t('conn.disconnect') })] })) : (_jsxs(_Fragment, { children: [_jsx(Menu, { open: serverMenuOpen, onClose: () => { setServerMenuOpen(false); }, items: serverMenuItems, selectedId: selectedServer?.id, onSelect: (id) => {
                                            setServerMenuOpen(false);
                                            setSelectedId(id);
                                        }, align: "end", portal: true, anchor: (_jsx("button", { type: "button", className: css.serverSelect, onClick: () => { setServerMenuOpen(true); }, children: selectedServer?.name ?? t('conn.select') })) }), _jsx(Button, { variant: "primary", size: "sm", disabled: selectedServer === null || connectingId !== null, onClick: () => { if (selectedServer !== null)
                                            void handleConnect(selectedServer.id); }, children: connectingId !== null ? t('conn.connecting') : t('conn.connect') })] })), _jsx("button", { type: "button", className: css.iconButton, "aria-label": t('conn.manage'), title: t('conn.manage'), onClick: () => { setManageOpen(true); }, children: _jsx(IconSettingsOutline14, {}) })] })), _jsx("button", { type: "button", className: css.close, "aria-label": t('panel.close'), title: t('panel.close'), onClick: () => { closeDetails(); }, children: _jsx(IconCloseOutline16, {}) })] }), _jsxs("div", { className: css.body, children: [loadError !== null && (_jsxs("div", { className: css.empty, children: [_jsx(IconWarningOutline16, {}), _jsx("span", { children: loadError })] })), loadError === null && response === null && _jsx("div", { className: css.empty, children: t('tree.loading') }), connectError !== null && (_jsx("div", { className: css.errorText, role: "alert", children: t('conn.failed', { message: connectError }) })), response !== null && loadError === null && openFile === null && mode === 'local' && (localRoot === undefined
                        ? _jsx("div", { className: css.empty, children: t('tree.empty') })
                        : (_jsx(FileTree, { root: localRoot, list: (path, signal) => list(sid, path, signal), mode: "local", onOpenFile: setOpenFile, onCreate: (dirPath, kind) => { setCreateTarget({ dirPath, kind }); setNewName(''); setCreateError(null); }, onDelete: setDeleteTarget, onOpenLocal: handleOpenLocal, t: t }, `local-${localRoot}`))), response !== null && loadError === null && openFile === null && mode === 'ssh' && (connected && sshRoot !== null
                        ? (_jsx(FileTree, { root: sshRoot, list: (path, signal) => list(sid, path, signal), mode: "ssh", onOpenFile: setOpenFile, onCreate: (dirPath, kind) => { setCreateTarget({ dirPath, kind }); setNewName(''); setCreateError(null); }, onDelete: setDeleteTarget, onOpenLocal: handleOpenLocal, t: t }, `ssh-${sshRoot}`))
                        : (_jsx("div", { className: css.empty, children: response.state.servers.length === 0
                                ? _jsx("span", { children: t('conn.empty') })
                                : _jsx("span", { children: t('conn.notConnected') }) }))), openFile !== null && (_jsx(FileEditor, { path: openFile, read: (path, signal) => read(sid, path, signal), write: (path, content) => write(sid, path, content), onClose: () => { setOpenFile(null); }, t: t }))] }), _jsx(ServerManager, { open: manageOpen, onClose: () => { setManageOpen(false); }, servers: response?.state.servers ?? [], activeServerId: response?.state.serverId ?? null, addServer: async (input) => { setResponse(await addServer(sid, input)); }, updateServer: async (id, input) => { setResponse(await updateServer(sid, id, input)); }, removeServer: async (id) => { setResponse(await removeServer(sid, id)); }, t: t }), _jsxs(Modal, { open: createTarget !== null, onClose: () => { setCreateTarget(null); }, closeLabel: t('form.cancel'), title: createTarget?.kind === 'file' ? t('tree.newFile') : t('tree.newDir'), footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setCreateTarget(null); }, children: t('form.cancel') }), _jsx(Button, { variant: "primary", disabled: createBusy || newName.trim() === '', onClick: () => { void handleCreate(); }, children: t('tree.create') })] })), children: [createTarget !== null && _jsx("div", { className: css.createDir, children: createTarget.dirPath }), _jsx(Input, { value: newName, placeholder: t('tree.newNamePlaceholder'), onChange: event => { setNewName(event.target.value); }, onKeyDown: event => {
                            if (event.key === 'Enter' && newName.trim() !== '')
                                void handleCreate();
                        } }), createError !== null && _jsx("div", { className: css.errorText, role: "alert", children: createError })] }), _jsxs(Modal, { open: deleteTarget !== null, onClose: () => { setDeleteTarget(null); }, closeLabel: t('form.cancel'), title: t('tree.delete'), footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setDeleteTarget(null); }, children: t('form.cancel') }), _jsx(Button, { variant: "primary", disabled: deleteBusy, onClick: () => { void handleDelete(); }, children: t('tree.delete') })] })), children: [_jsx("div", { className: css.deleteText, children: deleteTarget !== null && t('tree.deleteConfirm', { name: deleteTarget.name }) }), deleteError !== null && _jsx("div", { className: css.errorText, role: "alert", children: deleteError })] })] }));
}
//# sourceMappingURL=panel.js.map