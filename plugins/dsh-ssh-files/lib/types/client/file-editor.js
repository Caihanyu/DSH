import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * FileEditor: the panel's read/write editor for one text file on the active
 * filesystem. Loads the content through the injected `read`, edits in a
 * plain textarea, and persists through `write` (temp + rename on the host).
 * A dirty close asks for confirmation instead of discarding silently.
 */
import { useEffect, useState } from 'react';
import { Button, IconCheckOutline16, IconCloseOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './SshFilesPanel.module.css';
/** The editor. */
export function FileEditor({ path, read, write, onClose, t }) {
    const [content, setContent] = useState(null);
    const [original, setOriginal] = useState('');
    const [loading, setLoading] = useState(true);
    const [readError, setReadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [savedFlash, setSavedFlash] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setReadError(null);
        read(path, controller.signal).then((text) => {
            setContent(text);
            setOriginal(text);
        }, (error) => {
            if (controller.signal.aborted)
                return;
            setReadError(error instanceof Error ? error.message : String(error));
        }).finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => { controller.abort(); };
    }, [path, read]);
    const dirty = content !== null && content !== original;
    const requestClose = () => {
        if (dirty) {
            setConfirmClose(true);
        }
        else {
            onClose();
        }
    };
    const save = async () => {
        if (content === null || saving)
            return;
        setSaving(true);
        setSaveError(null);
        try {
            await write(path, content);
            setOriginal(content);
            setSavedFlash(true);
            window.setTimeout(() => { setSavedFlash(false); }, 1500);
        }
        catch (error) {
            setSaveError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: css.editorRoot, children: [_jsxs("header", { className: css.editorHeader, children: [_jsx("div", { className: css.editorPath, title: path, children: path }), _jsxs("div", { className: css.editorActions, children: [dirty && _jsx("span", { className: css.editorDirty, children: t('editor.dirty') }), _jsx(Button, { variant: "primary", size: "sm", icon: _jsx(IconCheckOutline16, {}), disabled: content === null || saving || !dirty, onClick: () => { void save(); }, children: saving ? t('editor.saving') : t('editor.save') }), _jsx("button", { type: "button", className: css.iconButton, "aria-label": t('editor.close'), title: t('editor.close'), onClick: requestClose, children: _jsx(IconCloseOutline16, {}) })] })] }), loading && _jsx("div", { className: css.editorStatus, children: t('editor.loading') }), readError !== null && (_jsx("div", { className: css.editorError, role: "alert", children: t('editor.readFailed', { message: readError }) })), content !== null && (_jsx("textarea", { className: css.editorTextarea, value: content, spellCheck: false, onChange: event => { setContent(event.target.value); }, "aria-label": path })), saveError !== null && (_jsx("div", { className: css.editorError, role: "alert", children: t('editor.saveFailed', { message: saveError }) })), savedFlash && _jsx("div", { className: css.editorSaved, children: t('editor.saved') }), _jsx(Modal, { open: confirmClose, onClose: () => { setConfirmClose(false); }, closeLabel: t('form.cancel'), title: t('editor.unsaved'), footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => { setConfirmClose(false); }, children: t('form.cancel') }), _jsx(Button, { variant: "primary", onClick: () => {
                                setConfirmClose(false);
                                onClose();
                            }, children: t('editor.close') })] })) })] }));
}
//# sourceMappingURL=file-editor.js.map