import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ServerManager: two modals — the server list (edit / delete / add) and the
 * add-or-edit form. The form collects name, host, port, username,
 * authentication strategy (password / private key / agent), and the initial
 * directory; the host validates and persists records.
 */
import { useMemo, useState } from 'react';
import { Button, IconEditOutline16, IconGlobeOutline14, IconPlusOutline16, IconTrashOutline16, Input, Menu, Modal, Pill, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './SshFilesPanel.module.css';
/** A fresh empty draft. */
function emptyDraft() {
    return { name: '', host: '', port: '22', username: '', auth: 'password', password: '', keyPath: '', root: '' };
}
/** Draft from an existing record (for editing). */
function draftFromServer(server) {
    return {
        name: server.name,
        host: server.host,
        port: String(server.port),
        username: server.username,
        auth: server.auth,
        password: server.password ?? '',
        keyPath: server.keyPath ?? '',
        root: server.root,
    };
}
/** The add-or-edit form modal. */
function ServerFormModal({ initial, title, onSave, onCancel, t, }) {
    const [draft, setDraft] = useState(initial);
    const [authMenu, setAuthMenu] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (key, value) => {
        setDraft(current => ({ ...current, [key]: value }));
    };
    const authLabel = useMemo(() => {
        switch (draft.auth) {
            case 'password': return t('form.authPassword');
            case 'key': return t('form.authKey');
            case 'agent': return t('form.authAgent');
        }
    }, [draft.auth, t]);
    const submit = async () => {
        const port = Number.parseInt(draft.port, 10);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            setError(t('form.invalidPort'));
            return;
        }
        const input = {
            name: draft.name.trim(),
            host: draft.host.trim(),
            port,
            username: draft.username.trim(),
            auth: draft.auth,
            root: draft.root.trim(),
        };
        if (draft.auth === 'password' && draft.password !== '')
            input.password = draft.password;
        if (draft.auth === 'key' && draft.keyPath.trim() !== '')
            input.keyPath = draft.keyPath.trim();
        setBusy(true);
        setError(null);
        try {
            await onSave(input);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx(Modal, { open: true, onClose: onCancel, closeLabel: t('form.cancel'), title: title, footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: onCancel, children: t('form.cancel') }), _jsx(Button, { variant: "primary", disabled: busy, onClick: () => { void submit(); }, children: t('form.save') })] })), children: _jsxs("div", { className: css.formGrid, children: [_jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.name') }), _jsx(Input, { value: draft.name, placeholder: t('form.namePlaceholder'), onChange: event => { set('name', event.target.value); } })] }), _jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.host') }), _jsx(Input, { value: draft.host, placeholder: t('form.hostPlaceholder'), onChange: event => { set('host', event.target.value); } })] }), _jsxs("div", { className: css.formRow, children: [_jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.port') }), _jsx(Input, { value: draft.port, inputMode: "numeric", onChange: event => { set('port', event.target.value); } })] }), _jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.username') }), _jsx(Input, { value: draft.username, onChange: event => { set('username', event.target.value); } })] })] }), _jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.auth') }), _jsx(Menu, { open: authMenu, onClose: () => { setAuthMenu(false); }, items: [
                                { id: 'password', label: t('form.authPassword') },
                                { id: 'key', label: t('form.authKey') },
                                { id: 'agent', label: t('form.authAgent') },
                            ], selectedId: draft.auth, onSelect: (id) => {
                                setAuthMenu(false);
                                setDraft(current => ({ ...current, auth: id }));
                            }, align: "end", portal: true, anchor: (_jsx("button", { type: "button", className: css.authSelect, onClick: () => { setAuthMenu(true); }, children: authLabel })) })] }), draft.auth === 'password' && (_jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.password') }), _jsx(Input, { type: "password", value: draft.password, placeholder: t('form.passwordPlaceholder'), onChange: event => { set('password', event.target.value); } })] })), draft.auth === 'key' && (_jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.keyPath') }), _jsx(Input, { value: draft.keyPath, placeholder: t('form.keyPathPlaceholder'), onChange: event => { set('keyPath', event.target.value); } })] })), _jsxs("label", { className: css.formField, children: [_jsx("span", { className: css.formLabel, children: t('form.root') }), _jsx(Input, { value: draft.root, placeholder: t('form.rootPlaceholder'), onChange: event => { set('root', event.target.value); } })] }), error !== null && _jsx("div", { className: css.formError, role: "alert", children: error })] }) }));
}
/** The server list manager with add/edit/delete. */
export function ServerManager({ open, onClose, servers, activeServerId, addServer, updateServer, removeServer, t, }) {
    const [editing, setEditing] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);
    const startAdd = () => {
        setError(null);
        setEditing({ id: null, draft: emptyDraft() });
    };
    const startEdit = (server) => {
        setError(null);
        setEditing({ id: server.id, draft: draftFromServer(server) });
    };
    const handleSave = async (input) => {
        if (editing === null)
            return;
        if (editing.id === null) {
            await addServer(input);
        }
        else {
            await updateServer(editing.id, input);
        }
        setEditing(null);
    };
    const handleDelete = async (server) => {
        const confirmed = window.confirm(t('manage.deleteConfirm', { name: server.name }));
        if (!confirmed)
            return;
        setBusyId(server.id);
        setError(null);
        try {
            await removeServer(server.id);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusyId(null);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Modal, { open: open && editing === null, onClose: onClose, closeLabel: t('form.cancel'), title: t('manage.title'), footer: (_jsx(Button, { variant: "primary", icon: _jsx(IconPlusOutline16, {}), onClick: startAdd, children: t('manage.add') })), children: [error !== null && _jsx("div", { className: css.formError, role: "alert", children: error }), servers.length === 0 && _jsx("div", { className: css.empty, children: t('manage.empty') }), _jsx("div", { className: css.serverList, children: servers.map(server => (_jsxs("div", { className: css.serverRow, children: [_jsxs("div", { className: css.serverInfo, children: [_jsx(IconGlobeOutline14, { className: css.serverIcon }), _jsxs("div", { className: css.serverText, children: [_jsxs("div", { className: css.serverName, children: [server.name, server.id === activeServerId && (_jsx(Pill, { active: true, className: css.connectedPill, children: t('conn.connected') }))] }), _jsxs("div", { className: css.serverMeta, children: [server.username, "@", server.host, ":", server.port] })] })] }), _jsxs("div", { className: css.serverActions, children: [_jsx("button", { type: "button", className: css.iconButton, "aria-label": t('manage.edit'), title: t('manage.edit'), onClick: () => { startEdit(server); }, children: _jsx(IconEditOutline16, {}) }), _jsx("button", { type: "button", className: css.iconButton, "aria-label": t('manage.delete'), title: t('manage.delete'), disabled: busyId === server.id, onClick: () => { void handleDelete(server); }, children: _jsx(IconTrashOutline16, {}) })] })] }, server.id))) })] }), editing !== null && (_jsx(ServerFormModal, { initial: editing.draft, title: editing.id === null ? t('form.titleAdd') : t('form.titleEdit'), onSave: handleSave, onCancel: () => { setEditing(null); }, t: t }))] }));
}
//# sourceMappingURL=server-manager.js.map