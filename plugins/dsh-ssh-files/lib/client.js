window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-ssh-files",
  factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/panel.tsx
var import_react4 = require("react");
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/file-editor.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css:E:\DSH\plugins\dsh-ssh-files\src\client\SshFilesPanel.module.css
var css = ".DSMAfG_root{flex-direction:column;height:100%;min-height:0;display:flex}.DSMAfG_header{border-bottom:1px solid var(--dsw-alias-border-l2,#e2e8f0);flex:none;align-items:center;gap:6px;padding:6px 8px;display:flex}.DSMAfG_modeBar{align-items:center;gap:2px;display:flex}.DSMAfG_modeTab{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:999px;padding:2px 10px;font-size:12px;line-height:20px}.DSMAfG_modeTab:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DSMAfG_modeTabActive{background:var(--dsw-alias-button-primary-fill,#2563eb);color:#fff}.DSMAfG_modeTabActive:hover{background:var(--dsw-alias-button-primary-hover,#1d4ed8);color:#fff}.DSMAfG_connBar{flex:1;align-items:center;gap:6px;min-width:0;display:flex}.DSMAfG_connInfo{color:var(--dsw-alias-label-secondary,#475569);text-overflow:ellipsis;white-space:nowrap;flex:1;align-items:center;gap:5px;min-width:0;font-size:12px;line-height:20px;display:flex;overflow:hidden}.DSMAfG_serverSelect{appearance:none;border:1px solid var(--dsw-alias-border-l2,#e2e8f0);color:var(--dsw-alias-label-primary,#0f172a);cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border-radius:6px;max-width:150px;padding:3px 10px;font-size:12px;line-height:20px;overflow:hidden}.DSMAfG_serverSelect:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DSMAfG_close{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:6px;place-items:center;width:24px;height:24px;display:grid}.DSMAfG_close:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DSMAfG_body{flex-direction:column;flex:1;min-height:0;display:flex;overflow:auto}.DSMAfG_empty{color:var(--dsw-alias-label-tertiary,#94a3b8);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:24px 16px;font-size:13px;line-height:20px;display:flex}.DSMAfG_errorText{color:var(--dsw-alias-state-error-primary,#dc2626);padding:6px 10px;font-size:12px;line-height:18px}.DSMAfG_iconButton{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;place-items:center;width:24px;height:24px;display:grid}.DSMAfG_iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DSMAfG_iconButton:disabled{opacity:.45;cursor:default}.DSMAfG_treeRoot{flex-direction:column;flex:1;min-height:0;display:flex}.DSMAfG_treeToolbar{flex:none;align-items:center;gap:2px;padding:4px 6px;display:flex}.DSMAfG_toolbarButton{appearance:none;color:var(--dsw-alias-label-secondary,#475569);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:6px;align-items:center;gap:4px;padding:2px 8px;font-size:12px;line-height:18px;display:inline-flex}.DSMAfG_toolbarButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DSMAfG_tree{flex:1;min-height:0;padding-bottom:12px;overflow:auto}.DSMAfG_treeRow{align-items:center;height:26px;padding-right:6px;font-size:13px;line-height:20px;display:flex}.DSMAfG_treeRow:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DSMAfG_treeChevron{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;flex:none;place-items:center;width:18px;height:18px;display:grid}.DSMAfG_treeLabel{appearance:none;cursor:pointer;min-width:0;color:var(--dsw-alias-label-primary,#0f172a);background:0 0;border:none;flex:1;align-items:center;gap:5px;padding:0;font-size:13px;line-height:20px;display:flex}.DSMAfG_treeName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.DSMAfG_dirGlyph{color:var(--dsw-alias-state-business-primary,#2563eb);flex:none}.DSMAfG_fileGlyph{flex:none}.DSMAfG_parentLabel{color:var(--dsw-alias-label-tertiary,#94a3b8);width:14px;font-weight:600}.DSMAfG_treeError{color:var(--dsw-alias-state-error-primary,#dc2626);padding:2px 0;font-size:12px;line-height:18px}.DSMAfG_treeEmpty{color:var(--dsw-alias-label-tertiary,#94a3b8);padding:2px 0;font-size:12px;line-height:18px}.DSMAfG_loadingDot{background:var(--dsw-alias-label-tertiary,#94a3b8);border-radius:50%;width:8px;height:8px;animation:.9s ease-in-out infinite DSMAfG_ssh-files-pulse}@keyframes DSMAfG_ssh-files-pulse{0%,to{opacity:.3}50%{opacity:1}}.DSMAfG_editorRoot{flex-direction:column;flex:1;min-height:0;display:flex}.DSMAfG_editorHeader{border-bottom:1px solid var(--dsw-alias-border-l2,#e2e8f0);flex:none;align-items:center;gap:8px;padding:6px 8px;display:flex}.DSMAfG_editorPath{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary,#475569);text-align:left;direction:rtl;flex:1;font-size:12px;overflow:hidden}.DSMAfG_editorActions{flex:none;align-items:center;gap:6px;display:flex}.DSMAfG_editorDirty{color:var(--dsw-alias-state-warn-primary,#d97706);font-size:11px}.DSMAfG_editorStatus{color:var(--dsw-alias-label-tertiary,#94a3b8);padding:8px 12px;font-size:12px}.DSMAfG_editorError{color:var(--dsw-alias-state-error-primary,#dc2626);padding:6px 12px;font-size:12px;line-height:18px}.DSMAfG_editorSaved{background:var(--dsw-alias-state-success-primary,#16a34a);color:#fff;z-index:5;border-radius:999px;padding:3px 10px;font-size:12px;position:absolute;top:48px;right:16px}.DSMAfG_editorTextarea{resize:none;background:var(--dsw-alias-bg-base,#fff);width:100%;min-height:0;color:var(--dsw-alias-label-primary,#0f172a);tab-size:2;border:none;outline:none;flex:1;padding:10px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px}.DSMAfG_formGrid{flex-direction:column;gap:12px;min-width:320px;display:flex}.DSMAfG_formField{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.DSMAfG_formLabel{color:var(--dsw-alias-label-secondary,#475569);font-size:12px}.DSMAfG_formRow{gap:10px;display:flex}.DSMAfG_authSelect{appearance:none;border:1px solid var(--dsw-alias-border-l2,#e2e8f0);color:var(--dsw-alias-label-primary,#0f172a);cursor:pointer;text-align:left;background:0 0;border-radius:6px;padding:6px 10px;font-size:13px;line-height:20px}.DSMAfG_authSelect:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DSMAfG_formError{color:var(--dsw-alias-state-error-primary,#dc2626);font-size:12px;line-height:18px}.DSMAfG_serverList{flex-direction:column;gap:2px;min-width:320px;max-height:320px;display:flex;overflow:auto}.DSMAfG_serverRow{border-radius:6px;align-items:center;gap:8px;padding:6px 8px;display:flex}.DSMAfG_serverRow:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DSMAfG_serverInfo{flex:1;align-items:center;gap:8px;min-width:0;display:flex}.DSMAfG_serverIcon{color:var(--dsw-alias-label-tertiary,#94a3b8);flex:none}.DSMAfG_serverText{min-width:0}.DSMAfG_serverName{color:var(--dsw-alias-label-primary,#0f172a);align-items:center;gap:6px;font-size:13px;line-height:20px;display:flex}.DSMAfG_serverMeta{color:var(--dsw-alias-label-tertiary,#94a3b8);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.DSMAfG_serverActions{flex:none;align-items:center;gap:2px;display:flex}.DSMAfG_connectedPill{font-size:11px}.DSMAfG_createDir{color:var(--dsw-alias-label-tertiary,#94a3b8);text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px;font-size:12px;overflow:hidden}.DSMAfG_deleteText{color:var(--dsw-alias-label-primary,#0f172a);min-width:260px;font-size:13px;line-height:20px}";
var tagId = "@deepseek-ai/dsh-ssh-files/SshFilesPanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@deepseek-ai/dsh-ssh-files";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var SshFilesPanel_default = { "authSelect": "DSMAfG_authSelect", "body": "DSMAfG_body", "close": "DSMAfG_close", "connBar": "DSMAfG_connBar", "connInfo": "DSMAfG_connInfo", "connectedPill": "DSMAfG_connectedPill", "createDir": "DSMAfG_createDir", "deleteText": "DSMAfG_deleteText", "dirGlyph": "DSMAfG_dirGlyph", "editorActions": "DSMAfG_editorActions", "editorDirty": "DSMAfG_editorDirty", "editorError": "DSMAfG_editorError", "editorHeader": "DSMAfG_editorHeader", "editorPath": "DSMAfG_editorPath", "editorRoot": "DSMAfG_editorRoot", "editorSaved": "DSMAfG_editorSaved", "editorStatus": "DSMAfG_editorStatus", "editorTextarea": "DSMAfG_editorTextarea", "empty": "DSMAfG_empty", "errorText": "DSMAfG_errorText", "fileGlyph": "DSMAfG_fileGlyph", "formError": "DSMAfG_formError", "formField": "DSMAfG_formField", "formGrid": "DSMAfG_formGrid", "formLabel": "DSMAfG_formLabel", "formRow": "DSMAfG_formRow", "header": "DSMAfG_header", "iconButton": "DSMAfG_iconButton", "loadingDot": "DSMAfG_loadingDot", "modeBar": "DSMAfG_modeBar", "modeTab": "DSMAfG_modeTab", "modeTabActive": "DSMAfG_modeTabActive", "parentLabel": "DSMAfG_parentLabel", "root": "DSMAfG_root", "serverActions": "DSMAfG_serverActions", "serverIcon": "DSMAfG_serverIcon", "serverInfo": "DSMAfG_serverInfo", "serverList": "DSMAfG_serverList", "serverMeta": "DSMAfG_serverMeta", "serverName": "DSMAfG_serverName", "serverRow": "DSMAfG_serverRow", "serverSelect": "DSMAfG_serverSelect", "serverText": "DSMAfG_serverText", "ssh-files-pulse": "DSMAfG_ssh-files-pulse", "toolbarButton": "DSMAfG_toolbarButton", "tree": "DSMAfG_tree", "treeChevron": "DSMAfG_treeChevron", "treeEmpty": "DSMAfG_treeEmpty", "treeError": "DSMAfG_treeError", "treeLabel": "DSMAfG_treeLabel", "treeName": "DSMAfG_treeName", "treeRoot": "DSMAfG_treeRoot", "treeRow": "DSMAfG_treeRow", "treeToolbar": "DSMAfG_treeToolbar" };

// src/client/file-editor.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function FileEditor({ path, read, write, onClose, t }) {
  const [content, setContent] = (0, import_react.useState)(null);
  const [original, setOriginal] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [readError, setReadError] = (0, import_react.useState)(null);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [saveError, setSaveError] = (0, import_react.useState)(null);
  const [savedFlash, setSavedFlash] = (0, import_react.useState)(false);
  const [confirmClose, setConfirmClose] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    const controller = new AbortController();
    setLoading(true);
    setReadError(null);
    read(path, controller.signal).then(
      (text) => {
        setContent(text);
        setOriginal(text);
      },
      (error) => {
        if (controller.signal.aborted) return;
        setReadError(error instanceof Error ? error.message : String(error));
      }
    ).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => {
      controller.abort();
    };
  }, [path, read]);
  const dirty = content !== null && content !== original;
  const requestClose = () => {
    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };
  const save = async () => {
    if (content === null || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await write(path, content);
      setOriginal(content);
      setSavedFlash(true);
      window.setTimeout(() => {
        setSavedFlash(false);
      }, 1500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SshFilesPanel_default.editorRoot, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: SshFilesPanel_default.editorHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SshFilesPanel_default.editorPath, title: path, children: path }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: SshFilesPanel_default.editorActions, children: [
        dirty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SshFilesPanel_default.editorDirty, children: t("editor.dirty") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            variant: "primary",
            size: "sm",
            icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCheckOutline16, {}),
            disabled: content === null || saving || !dirty,
            onClick: () => {
              void save();
            },
            children: saving ? t("editor.saving") : t("editor.save")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: SshFilesPanel_default.iconButton,
            "aria-label": t("editor.close"),
            title: t("editor.close"),
            onClick: requestClose,
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutline16, {})
          }
        )
      ] })
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SshFilesPanel_default.editorStatus, children: t("editor.loading") }),
    readError !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SshFilesPanel_default.editorError, role: "alert", children: t("editor.readFailed", { message: readError }) }),
    content !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "textarea",
      {
        className: SshFilesPanel_default.editorTextarea,
        value: content,
        spellCheck: false,
        onChange: (event) => {
          setContent(event.target.value);
        },
        "aria-label": path
      }
    ),
    saveError !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SshFilesPanel_default.editorError, role: "alert", children: t("editor.saveFailed", { message: saveError }) }),
    savedFlash && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: SshFilesPanel_default.editorSaved, children: t("editor.saved") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: confirmClose,
        onClose: () => {
          setConfirmClose(false);
        },
        closeLabel: t("form.cancel"),
        title: t("editor.unsaved"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", onClick: () => {
            setConfirmClose(false);
          }, children: t("form.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              variant: "primary",
              onClick: () => {
                setConfirmClose(false);
                onClose();
              },
              children: t("editor.close")
            }
          )
        ] })
      }
    )
  ] });
}

// src/client/file-tree.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
function parentOf(path) {
  const trimmed = path.replace(/[\\/]+$/, "");
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  if (index <= 0) return path;
  return trimmed.slice(0, index);
}
function FileGlyph({ kind }) {
  return kind === "dir" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconFolderClose16, { className: SshFilesPanel_default.dirGlyph }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": true, className: SshFilesPanel_default.fileGlyph, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "path",
      {
        d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
        fill: "var(--dsw-alias-label-tertiary, #94a3b8)",
        opacity: "0.18"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "path",
      {
        d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
        fill: "none",
        stroke: "var(--dsw-alias-label-tertiary, #94a3b8)",
        strokeWidth: "1.1"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M9 1.5v3.5h3.5", fill: "none", stroke: "var(--dsw-alias-label-tertiary, #94a3b8)", strokeWidth: "1.1" })
  ] });
}
function TreeRow({
  entry,
  depth,
  list,
  showHidden,
  onOpenFile,
  onCreate,
  onDelete,
  t
}) {
  const [children, setChildren] = (0, import_react2.useState)(null);
  const [expanded, setExpanded] = (0, import_react2.useState)(false);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const [menuOpen, setMenuOpen] = (0, import_react2.useState)(false);
  const toggle = async () => {
    if (entry.kind !== "dir") {
      onOpenFile(entry.path);
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (children !== null) return;
    setLoading(true);
    setError(null);
    try {
      const listing = await list(entry.path);
      setChildren(listing.entries);
    } catch (error2) {
      setError(error2 instanceof Error ? error2.message : String(error2));
    } finally {
      setLoading(false);
    }
  };
  const menuItems = (0, import_react2.useMemo)(() => {
    const items = [];
    if (entry.kind === "dir") {
      items.push(
        { id: "new-file", label: t("tree.newFile") },
        { id: "new-dir", label: t("tree.newDir") }
      );
    }
    items.push({ id: "delete", label: t("tree.delete"), danger: true });
    return items;
  }, [entry.kind, t]);
  const onMenuSelect = (id) => {
    setMenuOpen(false);
    switch (id) {
      case "new-file":
        onCreate(entry.path, "file");
        break;
      case "new-dir":
        onCreate(entry.path, "dir");
        break;
      case "delete":
        onDelete(entry);
        break;
    }
  };
  const visibleChildren = showHidden ? children ?? [] : (children ?? []).filter((child) => !child.hidden);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        className: `${SshFilesPanel_default.treeRow} ${entry.kind === "dir" ? SshFilesPanel_default.treeRowDir : SshFilesPanel_default.treeRowFile}`,
        "data-kind": entry.kind,
        style: { paddingLeft: `${8 + depth * 14}px` },
        role: "treeitem",
        "aria-expanded": entry.kind === "dir" ? expanded : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: SshFilesPanel_default.treeChevron, "aria-hidden": true, tabIndex: -1, onClick: () => {
            void toggle();
          }, children: entry.kind === "dir" ? loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SshFilesPanel_default.loadingDot }) : expanded ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconChevronDownOutline14, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconChevronRightOutline14, {}) : null }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: SshFilesPanel_default.treeLabel, onClick: () => {
            void toggle();
          }, title: entry.path, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FileGlyph, { kind: entry.kind }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SshFilesPanel_default.treeName, children: entry.name })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_dsh_client_ui_primitives2.Menu,
            {
              open: menuOpen,
              onClose: () => {
                setMenuOpen(false);
              },
              items: menuItems,
              onSelect: onMenuSelect,
              align: "end",
              portal: true,
              anchor: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  className: SshFilesPanel_default.iconButton,
                  "aria-haspopup": "menu",
                  "aria-expanded": menuOpen,
                  "aria-label": entry.name,
                  onClick: () => {
                    setMenuOpen(true);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconEllipsisOutline16, {})
                }
              )
            }
          )
        ]
      }
    ),
    expanded && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "group", children: [
      error !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SshFilesPanel_default.treeError, style: { paddingLeft: `${24 + depth * 14}px` }, children: [
        t("tree.error"),
        "\uFF1A",
        error
      ] }),
      visibleChildren.map((child) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        TreeRow,
        {
          entry: child,
          depth: depth + 1,
          list,
          showHidden,
          onOpenFile,
          onCreate,
          onDelete,
          t
        },
        child.path
      )),
      visibleChildren.length === 0 && error === null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SshFilesPanel_default.treeEmpty, style: { paddingLeft: `${24 + depth * 14}px` }, children: t("tree.empty") })
    ] })
  ] });
}
function FileTree({ root, list, onOpenFile, onCreate, onDelete, t }) {
  const [refreshKey, setRefreshKey] = (0, import_react2.useState)(0);
  const [showHidden, setShowHidden] = (0, import_react2.useState)(false);
  const [parentMenu, setParentMenu] = (0, import_react2.useState)(false);
  const [failure, setFailure] = (0, import_react2.useState)(null);
  const rootEntry = { name: root, path: root, kind: "dir", hidden: false };
  const parent = parentOf(root);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SshFilesPanel_default.treeRoot, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SshFilesPanel_default.treeToolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          className: SshFilesPanel_default.toolbarButton,
          onClick: () => {
            setRefreshKey((value) => value + 1);
          },
          title: t("tree.refresh"),
          "aria-label": t("tree.refresh"),
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconRefreshOutline14, {})
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          className: SshFilesPanel_default.toolbarButton,
          onClick: () => {
            setShowHidden((value) => !value);
          },
          title: showHidden ? t("tree.hideHidden") : t("tree.showHidden"),
          children: showHidden ? t("tree.showHidden") : t("tree.hideHidden")
        }
      )
    ] }),
    failure !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SshFilesPanel_default.treeError, role: "alert", children: t("tree.openFailed", { message: failure.message }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "tree", "aria-label": root, className: SshFilesPanel_default.tree, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SshFilesPanel_default.treeRow, "data-kind": "dir", style: { paddingLeft: "8px" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_dsh_client_ui_primitives2.Menu,
        {
          open: parentMenu,
          onClose: () => {
            setParentMenu(false);
          },
          items: [
            { id: "new-file", label: t("tree.newFile") },
            { id: "new-dir", label: t("tree.newDir") }
          ],
          onSelect: (id) => {
            setParentMenu(false);
            if (id === "new-file") onCreate(parent, "file");
            if (id === "new-dir") onCreate(parent, "dir");
          },
          align: "end",
          portal: true,
          anchor: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              type: "button",
              className: SshFilesPanel_default.treeLabel,
              onClick: () => {
                setParentMenu(true);
              },
              title: t("tree.parent"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SshFilesPanel_default.parentLabel, children: ".." }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SshFilesPanel_default.treeName, children: t("tree.parent") })
              ]
            }
          )
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        TreeRow,
        {
          entry: rootEntry,
          depth: 0,
          list,
          showHidden,
          onOpenFile,
          onCreate,
          onDelete,
          t
        },
        `${root}-${refreshKey}`
      )
    ] })
  ] });
}

// src/client/server-manager.tsx
var import_react3 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime3 = require("react/jsx-runtime");
function emptyDraft() {
  return { name: "", host: "", port: "22", username: "", auth: "password", password: "", keyPath: "", root: "" };
}
function draftFromServer(server) {
  return {
    name: server.name,
    host: server.host,
    port: String(server.port),
    username: server.username,
    auth: server.auth,
    password: server.password ?? "",
    keyPath: server.keyPath ?? "",
    root: server.root
  };
}
function ServerFormModal({
  initial,
  title,
  onSave,
  onCancel,
  t
}) {
  const [draft, setDraft] = (0, import_react3.useState)(initial);
  const [authMenu, setAuthMenu] = (0, import_react3.useState)(false);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(null);
  const set = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const authLabel = (0, import_react3.useMemo)(() => {
    switch (draft.auth) {
      case "password":
        return t("form.authPassword");
      case "key":
        return t("form.authKey");
      case "agent":
        return t("form.authAgent");
    }
  }, [draft.auth, t]);
  const submit = async () => {
    const port = Number.parseInt(draft.port, 10);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setError(t("form.invalidPort"));
      return;
    }
    const input = {
      name: draft.name.trim(),
      host: draft.host.trim(),
      port,
      username: draft.username.trim(),
      auth: draft.auth,
      root: draft.root.trim()
    };
    if (draft.auth === "password" && draft.password !== "") input.password = draft.password;
    if (draft.auth === "key" && draft.keyPath.trim() !== "") input.keyPath = draft.keyPath.trim();
    setBusy(true);
    setError(null);
    try {
      await onSave(input);
    } catch (error2) {
      setError(error2 instanceof Error ? error2.message : String(error2));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_dsh_client_ui_primitives3.Modal,
    {
      open: true,
      onClose: onCancel,
      closeLabel: t("form.cancel"),
      title,
      footer: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", onClick: onCancel, children: t("form.cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "primary", disabled: busy, onClick: () => {
          void submit();
        }, children: t("form.save") })
      ] }),
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.formGrid, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.name") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Input,
            {
              value: draft.name,
              placeholder: t("form.namePlaceholder"),
              onChange: (event) => {
                set("name", event.target.value);
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.host") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Input,
            {
              value: draft.host,
              placeholder: t("form.hostPlaceholder"),
              onChange: (event) => {
                set("host", event.target.value);
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.formRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.port") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_dsh_client_ui_primitives3.Input,
              {
                value: draft.port,
                inputMode: "numeric",
                onChange: (event) => {
                  set("port", event.target.value);
                }
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.username") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_dsh_client_ui_primitives3.Input,
              {
                value: draft.username,
                onChange: (event) => {
                  set("username", event.target.value);
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.auth") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Menu,
            {
              open: authMenu,
              onClose: () => {
                setAuthMenu(false);
              },
              items: [
                { id: "password", label: t("form.authPassword") },
                { id: "key", label: t("form.authKey") },
                { id: "agent", label: t("form.authAgent") }
              ],
              selectedId: draft.auth,
              onSelect: (id) => {
                setAuthMenu(false);
                setDraft((current) => ({ ...current, auth: id }));
              },
              align: "end",
              portal: true,
              anchor: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: SshFilesPanel_default.authSelect, onClick: () => {
                setAuthMenu(true);
              }, children: authLabel })
            }
          )
        ] }),
        draft.auth === "password" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.password") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Input,
            {
              type: "password",
              value: draft.password,
              placeholder: t("form.passwordPlaceholder"),
              onChange: (event) => {
                set("password", event.target.value);
              }
            }
          )
        ] }),
        draft.auth === "key" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.keyPath") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Input,
            {
              value: draft.keyPath,
              placeholder: t("form.keyPathPlaceholder"),
              onChange: (event) => {
                set("keyPath", event.target.value);
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: SshFilesPanel_default.formField, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SshFilesPanel_default.formLabel, children: t("form.root") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Input,
            {
              value: draft.root,
              placeholder: t("form.rootPlaceholder"),
              onChange: (event) => {
                set("root", event.target.value);
              }
            }
          )
        ] }),
        error !== null && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SshFilesPanel_default.formError, role: "alert", children: error })
      ] })
    }
  );
}
function ServerManager({
  open,
  onClose,
  servers,
  activeServerId,
  addServer,
  updateServer,
  removeServer,
  t
}) {
  const [editing, setEditing] = (0, import_react3.useState)(null);
  const [busyId, setBusyId] = (0, import_react3.useState)(null);
  const [error, setError] = (0, import_react3.useState)(null);
  const startAdd = () => {
    setError(null);
    setEditing({ id: null, draft: emptyDraft() });
  };
  const startEdit = (server) => {
    setError(null);
    setEditing({ id: server.id, draft: draftFromServer(server) });
  };
  const handleSave = async (input) => {
    if (editing === null) return;
    if (editing.id === null) {
      await addServer(input);
    } else {
      await updateServer(editing.id, input);
    }
    setEditing(null);
  };
  const handleDelete = async (server) => {
    const confirmed = window.confirm(t("manage.deleteConfirm", { name: server.name }));
    if (!confirmed) return;
    setBusyId(server.id);
    setError(null);
    try {
      await removeServer(server.id);
    } catch (error2) {
      setError(error2 instanceof Error ? error2.message : String(error2));
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      import_dsh_client_ui_primitives3.Modal,
      {
        open: open && editing === null,
        onClose,
        closeLabel: t("form.cancel"),
        title: t("manage.title"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "primary", icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconPlusOutline16, {}), onClick: startAdd, children: t("manage.add") }),
        children: [
          error !== null && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SshFilesPanel_default.formError, role: "alert", children: error }),
          servers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SshFilesPanel_default.empty, children: t("manage.empty") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SshFilesPanel_default.serverList, children: servers.map((server) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverInfo, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconGlobeOutline14, { className: SshFilesPanel_default.serverIcon }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverText, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverName, children: [
                  server.name,
                  server.id === activeServerId && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Pill, { active: true, className: SshFilesPanel_default.connectedPill, children: t("conn.connected") })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverMeta, children: [
                  server.username,
                  "@",
                  server.host,
                  ":",
                  server.port
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SshFilesPanel_default.serverActions, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  type: "button",
                  className: SshFilesPanel_default.iconButton,
                  "aria-label": t("manage.edit"),
                  title: t("manage.edit"),
                  onClick: () => {
                    startEdit(server);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconEditOutline16, {})
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  type: "button",
                  className: SshFilesPanel_default.iconButton,
                  "aria-label": t("manage.delete"),
                  title: t("manage.delete"),
                  disabled: busyId === server.id,
                  onClick: () => {
                    void handleDelete(server);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconTrashOutline16, {})
                }
              )
            ] })
          ] }, server.id)) })
        ]
      }
    ),
    editing !== null && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      ServerFormModal,
      {
        initial: editing.draft,
        title: editing.id === null ? t("form.titleAdd") : t("form.titleEdit"),
        onSave: handleSave,
        onCancel: () => {
          setEditing(null);
        },
        t
      }
    )
  ] });
}

// src/client/panel.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function joinPath(dir, name) {
  return dir.endsWith("/") || dir.endsWith("\\") ? dir + name : `${dir}/${name}`;
}
function SshFilesPanel(props) {
  const {
    sessionId: sid,
    t,
    getState,
    setMode,
    addServer,
    updateServer,
    removeServer,
    connect,
    disconnect,
    list,
    read,
    write,
    mkdir,
    unlink,
    openNewSessionOn
  } = props;
  const [response, setResponse] = (0, import_react4.useState)(null);
  const [loadError, setLoadError] = (0, import_react4.useState)(null);
  const [connectingId, setConnectingId] = (0, import_react4.useState)(null);
  const [connectError, setConnectError] = (0, import_react4.useState)(null);
  const [selectedId, setSelectedId] = (0, import_react4.useState)(null);
  const [serverMenuOpen, setServerMenuOpen] = (0, import_react4.useState)(false);
  const [manageOpen, setManageOpen] = (0, import_react4.useState)(false);
  const [openFile, setOpenFile] = (0, import_react4.useState)(null);
  const [createTarget, setCreateTarget] = (0, import_react4.useState)(null);
  const [deleteTarget, setDeleteTarget] = (0, import_react4.useState)(null);
  const [newName, setNewName] = (0, import_react4.useState)("");
  const [createBusy, setCreateBusy] = (0, import_react4.useState)(false);
  const [createError, setCreateError] = (0, import_react4.useState)(null);
  const [deleteBusy, setDeleteBusy] = (0, import_react4.useState)(false);
  const [deleteError, setDeleteError] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    const controller = new AbortController();
    setLoadError(null);
    const report = (error) => {
      if (controller.signal.aborted) return;
      setLoadError(error instanceof Error ? error.message : String(error));
    };
    getState(sid, controller.signal).then(
      (state) => {
        if (controller.signal.aborted) return;
        if (state.state.mode === "ssh") {
          setResponse(state);
          return;
        }
        void setMode(sid, "ssh").then(
          (next) => {
            if (!controller.signal.aborted) setResponse(next);
          },
          report
        );
      },
      report
    );
    return () => {
      controller.abort();
    };
  }, [getState, setMode, sid]);
  const connected = response?.state.connected ?? false;
  const activeServer = (0, import_react4.useMemo)(
    () => response?.state.servers.find((server) => server.id === response.state.serverId) ?? null,
    [response]
  );
  const selectedServer = (0, import_react4.useMemo)(
    () => response?.state.servers.find((server) => server.id === (selectedId ?? response.state.serverId)) ?? null,
    [response, selectedId]
  );
  const sshRoot = response?.root ?? null;
  const autoConnectTried = (0, import_react4.useRef)(false);
  (0, import_react4.useEffect)(() => {
    if (autoConnectTried.current) return;
    if (response === null || loadError !== null) return;
    const st = response.state;
    if (st.mode !== "ssh" || st.serverId === null || st.connected) return;
    if (st.servers.find((candidate) => candidate.id === st.serverId) === void 0) return;
    autoConnectTried.current = true;
    setConnectingId(st.serverId);
    void connect(sid, st.serverId).then(
      setResponse,
      (error) => {
        autoConnectTried.current = false;
        setConnectError(error instanceof Error ? error.message : String(error));
      }
    ).finally(() => {
      setConnectingId(null);
    });
  }, [response, loadError, connect]);
  const handleConnect = async (id) => {
    setConnectingId(id);
    setConnectError(null);
    setOpenFile(null);
    try {
      setResponse(await connect(sid, id));
      setSelectedId(id);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error));
    } finally {
      setConnectingId(null);
    }
  };
  const handleDisconnect = async () => {
    setOpenFile(null);
    setConnectError(null);
    try {
      setResponse(await disconnect(sid));
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error));
    }
  };
  const handleNewSessionOn = async (serverId) => {
    setConnectError(null);
    try {
      await openNewSessionOn(serverId);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error));
    }
  };
  const handleCreate = async () => {
    if (createTarget === null) return;
    const name = newName.trim();
    if (name === "") return;
    const target = joinPath(createTarget.dirPath, name);
    setCreateBusy(true);
    setCreateError(null);
    try {
      if (createTarget.kind === "file") {
        await write(sid, target, "");
      } else {
        await mkdir(sid, target);
      }
      setCreateTarget(null);
      setNewName("");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : String(error));
    } finally {
      setCreateBusy(false);
    }
  };
  const handleDelete = async () => {
    if (deleteTarget === null) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await unlink(sid, deleteTarget.path);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleteBusy(false);
    }
  };
  const serverMenuItems = (response?.state.servers ?? []).map((server) => ({
    id: server.id,
    label: `${server.name}\uFF08${server.username}@${server.host}\uFF09`
  }));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SshFilesPanel_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("header", { className: SshFilesPanel_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SshFilesPanel_default.connBar, children: [
      connected && activeServer !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: SshFilesPanel_default.connInfo, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.StateDot, { state: "done" }),
          t("conn.connectedTo", { name: activeServer.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_dsh_client_ui_primitives4.Button,
          {
            variant: "outline",
            size: "sm",
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconPlusOutline16, {}),
            title: t("conn.newSessionOn"),
            onClick: () => {
              void handleNewSessionOn(activeServer.id);
            },
            children: t("conn.newSessionOn")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "outline", size: "sm", onClick: () => {
          void handleDisconnect();
        }, children: t("conn.disconnect") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_dsh_client_ui_primitives4.Menu,
          {
            open: serverMenuOpen,
            onClose: () => {
              setServerMenuOpen(false);
            },
            items: serverMenuItems,
            selectedId: selectedServer?.id,
            onSelect: (id) => {
              setServerMenuOpen(false);
              setSelectedId(id);
            },
            align: "end",
            portal: true,
            anchor: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: SshFilesPanel_default.serverSelect, onClick: () => {
              setServerMenuOpen(true);
            }, children: selectedServer?.name ?? t("conn.select") })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_dsh_client_ui_primitives4.Button,
          {
            variant: "primary",
            size: "sm",
            disabled: selectedServer === null || connectingId !== null,
            onClick: () => {
              if (selectedServer !== null) void handleConnect(selectedServer.id);
            },
            children: connectingId !== null ? t("conn.connecting") : t("conn.connect")
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          type: "button",
          className: SshFilesPanel_default.iconButton,
          "aria-label": t("conn.manage"),
          title: t("conn.manage"),
          onClick: () => {
            setManageOpen(true);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconSettingsOutline14, {})
        }
      )
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SshFilesPanel_default.body, children: [
      loadError !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: SshFilesPanel_default.empty, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.IconWarningOutline16, {}),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: loadError })
      ] }),
      loadError === null && response === null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.empty, children: t("tree.loading") }),
      connectError !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.errorText, role: "alert", children: t("conn.failed", { message: connectError }) }),
      response !== null && loadError === null && openFile === null && (connected && sshRoot !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        FileTree,
        {
          root: sshRoot,
          list: (path, signal) => list(sid, path, signal),
          onOpenFile: setOpenFile,
          onCreate: (dirPath, kind) => {
            setCreateTarget({ dirPath, kind });
            setNewName("");
            setCreateError(null);
          },
          onDelete: setDeleteTarget,
          t
        },
        `ssh-${sshRoot}`
      ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.empty, children: response.state.servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("conn.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("conn.notConnected") }) })),
      openFile !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        FileEditor,
        {
          path: openFile,
          read: (path, signal) => read(sid, path, signal),
          write: (path, content) => write(sid, path, content),
          onClose: () => {
            setOpenFile(null);
          },
          t
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      ServerManager,
      {
        open: manageOpen,
        onClose: () => {
          setManageOpen(false);
        },
        servers: response?.state.servers ?? [],
        activeServerId: response?.state.serverId ?? null,
        addServer: async (input) => {
          setResponse(await addServer(sid, input));
        },
        updateServer: async (id, input) => {
          setResponse(await updateServer(sid, id, input));
        },
        removeServer: async (id) => {
          setResponse(await removeServer(sid, id));
        },
        t
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      import_dsh_client_ui_primitives4.Modal,
      {
        open: createTarget !== null,
        onClose: () => {
          setCreateTarget(null);
        },
        closeLabel: t("form.cancel"),
        title: createTarget?.kind === "file" ? t("tree.newFile") : t("tree.newDir"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "outline", onClick: () => {
            setCreateTarget(null);
          }, children: t("form.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "primary", disabled: createBusy || newName.trim() === "", onClick: () => {
            void handleCreate();
          }, children: t("tree.create") })
        ] }),
        children: [
          createTarget !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.createDir, children: createTarget.dirPath }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives4.Input,
            {
              value: newName,
              placeholder: t("tree.newNamePlaceholder"),
              onChange: (event) => {
                setNewName(event.target.value);
              },
              onKeyDown: (event) => {
                if (event.key === "Enter" && newName.trim() !== "") void handleCreate();
              }
            }
          ),
          createError !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.errorText, role: "alert", children: createError })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      import_dsh_client_ui_primitives4.Modal,
      {
        open: deleteTarget !== null,
        onClose: () => {
          setDeleteTarget(null);
        },
        closeLabel: t("form.cancel"),
        title: t("tree.delete"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "outline", onClick: () => {
            setDeleteTarget(null);
          }, children: t("form.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives4.Button, { variant: "primary", disabled: deleteBusy, onClick: () => {
            void handleDelete();
          }, children: t("tree.delete") })
        ] }),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.deleteText, children: deleteTarget !== null && t("tree.deleteConfirm", { name: deleteTarget.name }) }),
          deleteError !== null && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: SshFilesPanel_default.errorText, role: "alert", children: deleteError })
        ]
      }
    )
  ] });
}

// src/client/locales.ts
var zh = {
  "panel.title": "\u6587\u4EF6",
  "panel.close": "\u5173\u95ED\u9762\u677F",
  "tab.title": "SSH \u6587\u4EF6",
  "guide.description": "\u8FDE\u63A5 SSH \u670D\u52A1\u5668\uFF0C\u6D4F\u89C8\u5E76\u7F16\u8F91\u8FDC\u7AEF\u6587\u4EF6\uFF08\u4F1A\u8BDD\u5404\u81EA\u8BB0\u4F4F\u8FDE\u63A5\uFF09",
  "mode.local": "\u672C\u5730",
  "mode.ssh": "SSH",
  "mode.tip": "\u9009\u62E9\u5DE5\u4F5C\u65B9\u5F0F\uFF08\u9ED8\u8BA4\u6253\u5F00\u6700\u8FD1\u4E00\u6B21\u4F7F\u7528\u7684\u65B9\u5F0F\uFF09",
  "conn.select": "\u9009\u62E9\u670D\u52A1\u5668",
  "conn.connect": "\u8FDE\u63A5",
  "conn.connecting": "\u8FDE\u63A5\u4E2D\u2026",
  "conn.disconnect": "\u65AD\u5F00",
  "conn.manage": "\u7BA1\u7406\u670D\u52A1\u5668",
  "conn.connectedTo": "\u5DF2\u8FDE\u63A5 {name}",
  "conn.connected": "\u5DF2\u8FDE\u63A5",
  "conn.notConnected": "\u672A\u8FDE\u63A5",
  "conn.newSessionOn": "\u4EE5\u6B64\u670D\u52A1\u5668\u5F00\u65B0\u5BF9\u8BDD",
  "conn.empty": "\u8FD8\u6CA1\u6709\u4FDD\u5B58\u7684\u670D\u52A1\u5668\uFF0C\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C\u7BA1\u7406\u670D\u52A1\u5668\u300D\u6DFB\u52A0\u3002",
  "conn.failed": "\u8FDE\u63A5\u5931\u8D25\uFF1A{message}",
  "conn.serverLabel": "\u670D\u52A1\u5668\u300C{name}\u300D",
  "manage.title": "\u7BA1\u7406\u670D\u52A1\u5668",
  "manage.add": "\u6DFB\u52A0\u670D\u52A1\u5668",
  "manage.edit": "\u7F16\u8F91",
  "manage.delete": "\u5220\u9664",
  "manage.empty": "\u6682\u65E0\u670D\u52A1\u5668\u8BB0\u5F55",
  "manage.deleteConfirm": "\u5220\u9664\u670D\u52A1\u5668\u300C{name}\u300D\uFF1F",
  "form.titleAdd": "\u6DFB\u52A0\u670D\u52A1\u5668",
  "form.titleEdit": "\u7F16\u8F91\u670D\u52A1\u5668",
  "form.name": "\u540D\u79F0",
  "form.namePlaceholder": "\u4F8B\u5982\uFF1A\u751F\u4EA7\u73AF\u5883",
  "form.host": "\u4E3B\u673A\u5730\u5740",
  "form.hostPlaceholder": "\u4F8B\u5982\uFF1A192.168.1.10 \u6216 server.example.com",
  "form.port": "\u7AEF\u53E3",
  "form.username": "\u7528\u6237\u540D",
  "form.auth": "\u8BA4\u8BC1\u65B9\u5F0F",
  "form.authPassword": "\u5BC6\u7801",
  "form.authKey": "\u79C1\u94A5\u6587\u4EF6",
  "form.authAgent": "SSH Agent / \u9ED8\u8BA4\u5BC6\u94A5",
  "form.password": "\u5BC6\u7801",
  "form.passwordPlaceholder": "\u767B\u5F55\u5BC6\u7801",
  "form.keyPath": "\u79C1\u94A5\u8DEF\u5F84",
  "form.keyPathPlaceholder": "\u4F8B\u5982\uFF1AC:\\Users\\me\\.ssh\\id_rsa \u6216 ~/.ssh/id_rsa",
  "form.root": "\u521D\u59CB\u76EE\u5F55",
  "form.rootPlaceholder": "\u7559\u7A7A\u5219\u4F7F\u7528\u767B\u5F55\u76EE\u5F55\uFF08\u5BB6\u76EE\u5F55\uFF09",
  "form.save": "\u4FDD\u5B58",
  "form.cancel": "\u53D6\u6D88",
  "form.invalidPort": "\u7AEF\u53E3\u5FC5\u987B\u662F 1-65535 \u7684\u6574\u6570",
  "tree.loading": "\u6B63\u5728\u52A0\u8F7D\u2026",
  "tree.empty": "\uFF08\u7A7A\u76EE\u5F55\uFF09",
  "tree.error": "\u65E0\u6CD5\u8BFB\u53D6\u76EE\u5F55",
  "tree.retry": "\u91CD\u8BD5",
  "tree.showHidden": "\u663E\u793A\u9690\u85CF\u6587\u4EF6",
  "tree.hideHidden": "\u9690\u85CF\u9690\u85CF\u6587\u4EF6",
  "tree.parent": "\u4E0A\u7EA7\u76EE\u5F55",
  "tree.refresh": "\u5237\u65B0",
  "tree.newFile": "\u65B0\u5EFA\u6587\u4EF6",
  "tree.newDir": "\u65B0\u5EFA\u76EE\u5F55",
  "tree.newName": "\u540D\u79F0",
  "tree.newNamePlaceholder": "\u8F93\u5165\u540D\u79F0",
  "tree.create": "\u521B\u5EFA",
  "tree.delete": "\u5220\u9664",
  "tree.deleteConfirm": "\u5220\u9664\u300C{name}\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",
  "tree.openCode": "\u5728 VS Code \u4E2D\u6253\u5F00",
  "tree.openMarktext": "\u7528 MarkText \u6253\u5F00",
  "tree.openDefault": "\u7528\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00",
  "tree.openFailed": "\u6253\u5F00\u5931\u8D25\uFF1A{message}",
  "editor.title": "\u6587\u4EF6",
  "editor.close": "\u5173\u95ED\u7F16\u8F91\u5668",
  "editor.save": "\u4FDD\u5B58",
  "editor.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "editor.saved": "\u5DF2\u4FDD\u5B58",
  "editor.loading": "\u6B63\u5728\u8BFB\u53D6\u2026",
  "editor.readFailed": "\u8BFB\u53D6\u5931\u8D25\uFF1A{message}",
  "editor.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{message}",
  "editor.unsaved": "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF0C\u5173\u95ED\u5C06\u4E22\u5931\u3002\u786E\u5B9A\u5173\u95ED\uFF1F",
  "editor.dirty": "\u672A\u4FDD\u5B58",
  "editor.bytes": "{size} \u5B57\u8282"
};
var en = {
  "panel.title": "Files",
  "panel.close": "Close panel",
  "tab.title": "SSH Files",
  "guide.description": "Connect to an SSH server and browse or edit its files (each session remembers its own connection)",
  "mode.local": "Local",
  "mode.ssh": "SSH",
  "mode.tip": "Choose the working mode (the last used one opens by default)",
  "conn.select": "Select server",
  "conn.connect": "Connect",
  "conn.connecting": "Connecting\u2026",
  "conn.disconnect": "Disconnect",
  "conn.manage": "Manage servers",
  "conn.connectedTo": "Connected to {name}",
  "conn.connected": "Connected",
  "conn.notConnected": "Not connected",
  "conn.newSessionOn": "New conversation on this server",
  "conn.empty": 'No servers saved yet \u2014 click "Manage servers" in the top-right to add one.',
  "conn.failed": "Connection failed: {message}",
  "conn.serverLabel": 'Server "{name}"',
  "manage.title": "Manage servers",
  "manage.add": "Add server",
  "manage.edit": "Edit",
  "manage.delete": "Delete",
  "manage.empty": "No server records yet",
  "manage.deleteConfirm": 'Delete server "{name}"?',
  "form.titleAdd": "Add server",
  "form.titleEdit": "Edit server",
  "form.name": "Name",
  "form.namePlaceholder": "e.g. Production",
  "form.host": "Host",
  "form.hostPlaceholder": "e.g. 192.168.1.10 or server.example.com",
  "form.port": "Port",
  "form.username": "Username",
  "form.auth": "Authentication",
  "form.authPassword": "Password",
  "form.authKey": "Private key file",
  "form.authAgent": "SSH Agent / default keys",
  "form.password": "Password",
  "form.passwordPlaceholder": "Login password",
  "form.keyPath": "Private key path",
  "form.keyPathPlaceholder": "e.g. C:\\Users\\me\\.ssh\\id_rsa or ~/.ssh/id_rsa",
  "form.root": "Initial directory",
  "form.rootPlaceholder": "Leave empty to use the login home directory",
  "form.save": "Save",
  "form.cancel": "Cancel",
  "form.invalidPort": "Port must be an integer from 1 to 65535",
  "tree.loading": "Loading\u2026",
  "tree.empty": "(empty directory)",
  "tree.error": "Cannot read directory",
  "tree.retry": "Retry",
  "tree.showHidden": "Show hidden files",
  "tree.hideHidden": "Hide hidden files",
  "tree.parent": "Parent directory",
  "tree.refresh": "Refresh",
  "tree.newFile": "New file",
  "tree.newDir": "New folder",
  "tree.newName": "Name",
  "tree.newNamePlaceholder": "Enter a name",
  "tree.create": "Create",
  "tree.delete": "Delete",
  "tree.deleteConfirm": 'Delete "{name}"? This cannot be undone.',
  "tree.openCode": "Open in VS Code",
  "tree.openMarktext": "Open with MarkText",
  "tree.openDefault": "Open with default app",
  "tree.openFailed": "Open failed: {message}",
  "editor.title": "File",
  "editor.close": "Close editor",
  "editor.save": "Save",
  "editor.saving": "Saving\u2026",
  "editor.saved": "Saved",
  "editor.loading": "Reading\u2026",
  "editor.readFailed": "Read failed: {message}",
  "editor.saveFailed": "Save failed: {message}",
  "editor.unsaved": "You have unsaved changes; closing will discard them. Close anyway?",
  "editor.dirty": "Unsaved",
  "editor.bytes": "{size} bytes"
};

// src/client/index.ts
var NS = "ssh-files";
function parseServer(value) {
  if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed server record");
  const record = value;
  if (typeof record.id !== "string" || typeof record.name !== "string" || typeof record.host !== "string" || typeof record.port !== "number" || typeof record.username !== "string" || record.auth !== "password" && record.auth !== "key" && record.auth !== "agent" || typeof record.root !== "string") {
    throw new Error("ssh-files: malformed server record");
  }
  const server = {
    id: record.id,
    name: record.name,
    host: record.host,
    port: record.port,
    username: record.username,
    auth: record.auth,
    root: record.root
  };
  if (typeof record.password === "string") server.password = record.password;
  if (typeof record.keyPath === "string") server.keyPath = record.keyPath;
  return server;
}
function parseStateResponse(value) {
  if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed state response");
  const response = value;
  const state = response.state;
  if (typeof state !== "object" || state === null) throw new Error("ssh-files: malformed state");
  const record = state;
  if (record.mode !== "local" && record.mode !== "ssh") throw new Error("ssh-files: malformed mode");
  if (typeof record.serverId !== "string" && record.serverId !== null) {
    throw new Error("ssh-files: malformed server id");
  }
  if (typeof record.connected !== "boolean") throw new Error("ssh-files: malformed connected flag");
  if (!Array.isArray(record.servers)) throw new Error("ssh-files: malformed server list");
  const servers = record.servers.map(parseServer);
  const root = response.root === null || typeof response.root === "string" ? response.root : null;
  return {
    state: {
      mode: record.mode,
      serverId: record.serverId,
      connected: record.connected,
      servers
    },
    root
  };
}
function parseEntry(value) {
  if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed listing row");
  const { name, path, kind, hidden } = value;
  if (typeof name !== "string" || typeof path !== "string" || typeof hidden !== "boolean") {
    throw new Error("ssh-files: malformed listing row");
  }
  if (kind !== "dir" && kind !== "file") throw new Error("ssh-files: malformed listing row");
  return { name, path, kind, hidden };
}
function parseListing(value) {
  if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed listing response");
  const listing = value;
  if (typeof listing.path !== "string" || !Array.isArray(listing.entries)) {
    throw new Error("ssh-files: malformed listing response");
  }
  return { path: listing.path, entries: listing.entries.map(parseEntry) };
}
function parseRead(value) {
  if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed read response");
  const content = value.content;
  if (typeof content !== "string") throw new Error("ssh-files: malformed read response");
  return content;
}
var ROUTE_PATH = "/ssh-files";
async function callRoute(sessionId, endpoint, payload, signal) {
  const response = await fetch(`${ROUTE_PATH}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, sessionId }),
    ...signal === void 0 ? {} : { signal }
  });
  if (!response.ok) throw new Error(`ssh-files: ${endpoint} failed with HTTP ${response.status}`);
  const result = await response.json();
  if (result.ok !== true) {
    const message = typeof result.error?.message === "string" ? result.error.message : `ssh-files: ${endpoint} failed`;
    throw new Error(message);
  }
  return result.value;
}
var inject = ["slots", "locale", "sidebarRightTabs", "uiWorkspace"];
var TAB_ID = "@deepseek-ai/dsh-ssh-files";
var TAB_KIND = "ssh-files";
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ssh-files: dictionaries");
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => t("tab.title"),
    guide: [{
      order: 30,
      title: () => t("tab.title"),
      description: () => t("guide.description"),
      icon: import_dsh_client_ui_primitives5.IconFolderClose16
    }]
  }), "ssh-files: tab type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: TAB_ID,
    locale: NS,
    inject: () => ({
      getState: (sessionId, signal) => callRoute(sessionId, "get-state", {}, signal).then(parseStateResponse),
      setMode: (sessionId, mode) => callRoute(sessionId, "set-mode", { mode }).then(parseStateResponse),
      addServer: (sessionId, input) => callRoute(sessionId, "add-server", input).then(parseStateResponse),
      updateServer: (sessionId, id, input) => callRoute(sessionId, "update-server", { id, server: input }).then(parseStateResponse),
      removeServer: (sessionId, id) => callRoute(sessionId, "remove-server", { id }).then(parseStateResponse),
      connect: (sessionId, id, signal) => callRoute(sessionId, "connect", { id }, signal).then(parseStateResponse),
      disconnect: (sessionId) => callRoute(sessionId, "disconnect", {}).then(parseStateResponse),
      list: (sessionId, path, signal) => callRoute(sessionId, "list", { path }, signal).then(parseListing),
      read: (sessionId, path, signal) => callRoute(sessionId, "read", { path }, signal).then(parseRead),
      write: (sessionId, path, content) => callRoute(sessionId, "write", { path, content }).then(() => void 0),
      mkdir: (sessionId, path) => callRoute(sessionId, "mkdir", { path }).then(() => void 0),
      unlink: (sessionId, path) => callRoute(sessionId, "unlink", { path }).then(() => void 0),
      // Open the current workspace's New-Session view on this server: connect
      // first (also records it as the session default), then start a session,
      // which inherits that default (reusing the workspace's blank session
      // when one exists, per core semantics) and the panel auto-connects on
      // mount.
      openNewSessionOn: async (serverId) => {
        await callRoute("", "connect", { id: serverId });
        ctx.uiWorkspace.startSession();
      },
      openLocalDefault: (path) => callRoute("", "open-local", { path, command: "default" }).then(() => void 0),
      openLocalCode: (path) => callRoute("", "open-local", { path, command: "code" }).then(() => void 0),
      openLocalMarktext: (path) => callRoute("", "open-local", { path, command: "marktext" }).then(() => void 0)
    })
  }, SshFilesPanel)), "ssh-files: tab body");
}
return module.exports; } });
