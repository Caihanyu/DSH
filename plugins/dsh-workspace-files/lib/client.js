window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-workspace-files",
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

// plugins/dsh-workspace-files/src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// plugins/dsh-workspace-files/src/client/panel.tsx
var import_react3 = require("react");

// plugins/dsh-workspace-files/node_modules/@deepseek-ai/dsh-util-workspace-path/lib/index.js
var FILE_ADDRESS_PREFIX = "dsh-resource://file/";
function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%3A/gi, ":");
}
function encodePath(path) {
  return path.split("/").map(encodeSegment).join("/");
}
function sessionFileAddress(sessionId, path) {
  const normalized = path.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(sessionId)}/${encodePath(normalized)}`;
}

// plugins/dsh-workspace-files/src/client/files-tree.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css:E:\DSH\plugins\dsh-workspace-files\src\client\WorkspaceFilesPanel.module.css
var css = ".x9Uzca_root{border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);flex-direction:column;min-width:0;height:100%;display:flex}.x9Uzca_header{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:8px;padding:10px 12px 0;display:flex}.x9Uzca_tabs{gap:2px;min-width:0;display:flex}.x9Uzca_tab{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-bottom:2px solid #0000;border-radius:6px 6px 0 0;flex:none;padding:4px 12px 10px;font-size:13px;line-height:20px}.x9Uzca_tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.x9Uzca_tabActive,.x9Uzca_tabActive:hover{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);background:0 0;font-weight:500}.x9Uzca_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;place-items:center;display:grid}.x9Uzca_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.x9Uzca_body{flex:1;min-height:0;overflow-y:auto}.x9Uzca_empty{color:var(--dsw-alias-label-tertiary);padding:12px 16px;font-size:13px;line-height:20px}.x9Uzca_tree{flex-direction:column;height:100%;min-height:0;display:flex}.x9Uzca_treeToolbar{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:4px;padding:8px 10px;display:flex}.x9Uzca_treeRoot{min-width:0;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;font-weight:500;line-height:18px;overflow:hidden}.x9Uzca_iconButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;place-items:center;display:grid}.x9Uzca_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.x9Uzca_treeBody{flex:1;min-height:0;padding:6px 0 12px;overflow-y:auto}.x9Uzca_row{height:26px;color:var(--dsw-alias-label-primary);user-select:none;align-items:center;gap:6px;padding-right:8px;font-size:13px;line-height:20px;display:flex}.x9Uzca_row[data-dir]{cursor:pointer}.x9Uzca_row[data-dir]:hover{background:var(--dsw-alias-interactive-bg-hover)}.x9Uzca_row[data-file]{cursor:pointer}.x9Uzca_row[data-file]:hover{background:var(--dsw-alias-interactive-bg-hover)}.x9Uzca_chevron{color:var(--dsw-alias-label-tertiary);flex:none}.x9Uzca_folderIcon{color:var(--dsw-alias-state-warn-primary);flex:none}.x9Uzca_fileGlyph{flex:none}.x9Uzca_rowSpacer{flex:none;width:14px}.x9Uzca_rowName{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.x9Uzca_rowMenu{width:22px;height:22px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:5px;flex:none;place-items:center;padding:0;display:none}.x9Uzca_row:hover .x9Uzca_rowMenu,.x9Uzca_row:focus-within .x9Uzca_rowMenu{display:grid}.x9Uzca_rowMenu:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.x9Uzca_dialogBody{flex-direction:column;gap:12px;display:flex}.x9Uzca_dialogPath{font-family:var(--dsh-font-mono,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}.x9Uzca_dialogActions{flex-direction:column;gap:6px;display:flex}.x9Uzca_dialogAction{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);text-align:left;width:100%;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;padding:8px 12px;font-size:13px;line-height:20px;display:block}.x9Uzca_dialogAction:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l4)}.x9Uzca_errorText{color:var(--dsw-alias-state-error-primary)}.x9Uzca_rowError{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;padding-bottom:6px;font-size:12px;line-height:18px}.x9Uzca_inlineButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:5px;flex:none;padding:2px 8px;font-size:12px;line-height:18px}.x9Uzca_inlineButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.x9Uzca_actionError{border-top:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;display:flex}.x9Uzca_actionErrorText{min-width:0;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;flex:1;font-size:12px;line-height:18px}.x9Uzca_toolBody{flex-direction:column;height:100%;min-height:0;display:flex}.x9Uzca_toolList{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;max-height:40%;margin:0;padding:6px 8px;list-style:none;overflow-y:auto}.x9Uzca_toolList li{margin:0;padding:0}.x9Uzca_toolItem{text-align:left;width:100%;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:8px;padding:4px 8px;font-size:13px;line-height:20px;display:flex}.x9Uzca_toolItem:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.x9Uzca_toolItemActive,.x9Uzca_toolItemActive:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.x9Uzca_toolStatus{background:var(--dsw-alias-state-success-primary);border-radius:999px;flex:none;width:8px;height:8px}.x9Uzca_toolStatus[data-running]{background:var(--dsw-alias-state-warn-primary)}.x9Uzca_toolName{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-family:var(--dsh-font-mono,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);flex:1;font-size:12px;overflow:hidden}.x9Uzca_toolDetail{flex:1;min-height:0;padding:12px 16px;overflow-y:auto}.x9Uzca_toolDetailTitle{color:var(--dsw-alias-label-primary);margin-bottom:10px;font-size:13px;font-weight:500;line-height:20px}.x9Uzca_section{margin-bottom:16px}.x9Uzca_sectionLabel{color:var(--dsw-alias-label-secondary);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.x9Uzca_code{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-family:var(--dsh-font-mono,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;border-radius:8px;margin:0;padding:10px 12px;font-size:12px;line-height:20px;overflow:auto}.x9Uzca_code[data-error]{color:var(--dsw-alias-state-error-primary)}.x9Uzca_rowButton{width:100%;font:inherit;color:inherit;text-align:left;background:0 0;border:0}.x9Uzca_notice{border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;padding:8px 12px;font-size:12px;line-height:18px;display:flex}.x9Uzca_noticeText{flex:1;min-width:0}.x9Uzca_setupBody{flex-direction:column;gap:10px;display:flex}.x9Uzca_setupQuestion{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;line-height:20px}.x9Uzca_setupHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.x9Uzca_setupTable{border-spacing:0 6px;width:100%}.x9Uzca_setupCheckCell{vertical-align:middle;width:24px}.x9Uzca_setupNameCell{vertical-align:middle;width:116px}.x9Uzca_setupName{color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px}.x9Uzca_setupRole{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.x9Uzca_setupInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:100%;color:var(--dsw-alias-label-primary);border-radius:6px;padding:6px 8px;font-family:inherit;font-size:12px;line-height:18px}.x9Uzca_setupInput:focus{border-color:var(--dsw-alias-brand-primary,#4f8cff);outline:none}.x9Uzca_setupWarn{color:var(--dsw-alias-state-warning-primary,#f59e0b);margin:0;font-size:12px;line-height:18px}.x9Uzca_setupError{color:var(--dsw-alias-state-error-primary);margin:0 0 10px;font-size:12px;line-height:18px}.x9Uzca_setupFooter{justify-content:flex-end;gap:8px;display:flex}";
var tagId = "@deepseek-ai/dsh-workspace-files/WorkspaceFilesPanel.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@deepseek-ai/dsh-workspace-files";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var WorkspaceFilesPanel_default = { "actionError": "x9Uzca_actionError", "actionErrorText": "x9Uzca_actionErrorText", "body": "x9Uzca_body", "chevron": "x9Uzca_chevron", "close": "x9Uzca_close", "code": "x9Uzca_code", "dialogAction": "x9Uzca_dialogAction", "dialogActions": "x9Uzca_dialogActions", "dialogBody": "x9Uzca_dialogBody", "dialogPath": "x9Uzca_dialogPath", "empty": "x9Uzca_empty", "errorText": "x9Uzca_errorText", "fileGlyph": "x9Uzca_fileGlyph", "folderIcon": "x9Uzca_folderIcon", "header": "x9Uzca_header", "iconButton": "x9Uzca_iconButton", "inlineButton": "x9Uzca_inlineButton", "notice": "x9Uzca_notice", "noticeText": "x9Uzca_noticeText", "root": "x9Uzca_root", "row": "x9Uzca_row", "rowButton": "x9Uzca_rowButton", "rowError": "x9Uzca_rowError", "rowMenu": "x9Uzca_rowMenu", "rowName": "x9Uzca_rowName", "rowSpacer": "x9Uzca_rowSpacer", "section": "x9Uzca_section", "sectionLabel": "x9Uzca_sectionLabel", "setupBody": "x9Uzca_setupBody", "setupCheckCell": "x9Uzca_setupCheckCell", "setupError": "x9Uzca_setupError", "setupFooter": "x9Uzca_setupFooter", "setupHint": "x9Uzca_setupHint", "setupInput": "x9Uzca_setupInput", "setupName": "x9Uzca_setupName", "setupNameCell": "x9Uzca_setupNameCell", "setupQuestion": "x9Uzca_setupQuestion", "setupRole": "x9Uzca_setupRole", "setupTable": "x9Uzca_setupTable", "setupWarn": "x9Uzca_setupWarn", "tab": "x9Uzca_tab", "tabActive": "x9Uzca_tabActive", "tabs": "x9Uzca_tabs", "toolBody": "x9Uzca_toolBody", "toolDetail": "x9Uzca_toolDetail", "toolDetailTitle": "x9Uzca_toolDetailTitle", "toolItem": "x9Uzca_toolItem", "toolItemActive": "x9Uzca_toolItemActive", "toolList": "x9Uzca_toolList", "toolName": "x9Uzca_toolName", "toolStatus": "x9Uzca_toolStatus", "tree": "x9Uzca_tree", "treeBody": "x9Uzca_treeBody", "treeRoot": "x9Uzca_treeRoot", "treeToolbar": "x9Uzca_treeToolbar" };

// plugins/dsh-workspace-files/src/client/files-tree.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var MARKDOWN_EXTENSIONS = /* @__PURE__ */ new Set([".md", ".markdown", ".mdown", ".mkd"]);
var CODE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".py",
  ".pyw",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".psm1",
  ".json",
  ".jsonc",
  ".json5",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".editorconfig",
  ".html",
  ".htm",
  ".xhtml",
  ".css",
  ".scss",
  ".less",
  ".sass",
  ".vue",
  ".svelte",
  ".rs",
  ".go",
  ".java",
  ".kt",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".cc",
  ".cs",
  ".sql",
  ".xml",
  ".svg",
  ".php",
  ".rb",
  ".swift",
  ".lua",
  ".pl",
  ".r",
  ".dart",
  ".ex",
  ".exs",
  ".erl",
  ".hs",
  ".scala",
  ".groovy",
  ".dockerfile",
  ".tf"
]);
var CODE_BASENAMES = /* @__PURE__ */ new Set([
  "dockerfile",
  "makefile",
  "justfile",
  "gnumakefile",
  ".gitignore",
  ".gitattributes",
  ".gitmodules",
  ".dockerignore",
  ".npmrc",
  ".yarnrc",
  ".pypirc",
  ".eslintrc",
  ".prettierrc",
  "license",
  "copying"
]);
var OFFICE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".pdf",
  ".txt",
  ".csv",
  ".rtf",
  ".wps",
  ".et",
  ".dps"
]);
function extensionOf(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}
function fileKindOf(name) {
  const ext = extensionOf(name);
  if (MARKDOWN_EXTENSIONS.has(ext)) return "markdown";
  if (OFFICE_EXTENSIONS.has(ext)) return "office";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  const lower = name.toLowerCase();
  if (lower.startsWith(".env") || CODE_BASENAMES.has(lower)) return "code";
  return "other";
}
function basenameOf(path) {
  const trimmed = path.endsWith("/") || path.endsWith("\\") ? path.slice(0, -1) : path;
  const sep = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return sep === -1 ? trimmed : trimmed.slice(sep + 1);
}
function FileGlyph({ kind }) {
  const color = kind === "markdown" ? "var(--dsw-alias-state-info-primary, #3b82f6)" : kind === "office" ? "var(--dsw-alias-state-warning-primary, #f59e0b)" : kind === "code" ? "var(--dsw-alias-state-success-primary, #22c55e)" : "var(--dsw-alias-label-tertiary, #94a3b8)";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": true, className: WorkspaceFilesPanel_default.fileGlyph, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
        fill: color,
        opacity: "0.18"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
        fill: "none",
        stroke: color,
        strokeWidth: "1.1"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 1.5v3.5h3.5", fill: "none", stroke: color, strokeWidth: "1.1" })
  ] });
}
function FileTree({
  root,
  list,
  openPath,
  openInCode,
  openInMarkdown,
  openInOffice,
  openers,
  passThrough,
  onConfigure,
  openPreview,
  t
}) {
  const [levels, setLevels] = (0, import_react.useState)({});
  const [expanded, setExpanded] = (0, import_react.useState)({ [root]: true });
  const [loading, setLoading] = (0, import_react.useState)({});
  const [errors, setErrors] = (0, import_react.useState)({});
  const [showHidden, setShowHidden] = (0, import_react.useState)(false);
  const [menuEntry, setMenuEntry] = (0, import_react.useState)(null);
  const [failure, setFailure] = (0, import_react.useState)(null);
  const aborters = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const ensureLoaded = (path) => {
    setLoading((prev) => prev[path] === true ? prev : { ...prev, [path]: true });
    setErrors((prev) => {
      if (prev[path] === void 0) return prev;
      const { [path]: _dropped, ...rest } = prev;
      return rest;
    });
    const controller = new AbortController();
    aborters.current.set(path, controller);
    void list(path, controller.signal).then(
      (level) => {
        if (controller.signal.aborted) return;
        aborters.current.delete(path);
        setLevels((prev) => ({ ...prev, [path]: level }));
        setLoading((prev) => {
          const { [path]: _dropped, ...rest } = prev;
          return rest;
        });
      },
      (reason) => {
        if (controller.signal.aborted) return;
        aborters.current.delete(path);
        setLoading((prev) => {
          const { [path]: _dropped, ...rest } = prev;
          return rest;
        });
        setErrors((prev) => ({
          ...prev,
          [path]: reason instanceof Error ? reason.message : String(reason)
        }));
      }
    );
  };
  (0, import_react.useEffect)(() => {
    ensureLoaded(root);
  }, [root]);
  const toggle = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: prev[path] !== true }));
    if (expanded[path] !== true) ensureLoaded(path);
  };
  const refresh = () => {
    for (const controller of aborters.current.values()) controller.abort();
    aborters.current.clear();
    setLevels({});
    setErrors({});
    setLoading({});
    setExpanded({ [root]: true });
    setMenuEntry(null);
    setFailure(null);
    ensureLoaded(root);
  };
  const runOpen = (entry, opener) => {
    setFailure(null);
    void opener(entry.path).then(
      () => void 0,
      (reason) => {
        setFailure({
          path: entry.path,
          message: reason instanceof Error ? reason.message : String(reason),
          retry: () => {
            runOpen(entry, opener);
          }
        });
      }
    );
  };
  const primaryAction = (entry) => {
    const kind = fileKindOf(entry.name);
    const markdown = openers.markdown;
    const office = openers.office;
    const code = openers.code;
    if (kind === "markdown" && markdown !== void 0) {
      return { run: () => {
        runOpen(entry, openInMarkdown);
      }, label: t("file.openWith", { app: markdown }) };
    }
    if (kind === "office" && office !== void 0) {
      return { run: () => {
        runOpen(entry, openInOffice);
      }, label: t("file.openWith", { app: office }) };
    }
    if (kind === "code" && code !== void 0) {
      return { run: () => {
        runOpen(entry, openInCode);
      }, label: t("file.openWith", { app: code }) };
    }
    if (kind === "markdown" && code !== void 0) {
      return { run: () => {
        runOpen(entry, openInCode);
      }, label: t("file.openWith", { app: code }) };
    }
    return { run: () => {
      runOpen(entry, openPath);
    }, label: t("file.openDefault") };
  };
  const menuItems = (entry) => {
    const entries = [
      { id: "preview", label: t("file.openPreview"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconBrowseOutline16, {}) },
      { type: "separator", id: "openers" }
    ];
    if (openers.markdown !== void 0) {
      entries.push({ id: "markdown", label: t("file.openWith", { app: openers.markdown }), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconEditOutline16, {}) });
    }
    if (openers.office !== void 0) {
      entries.push({ id: "office", label: t("file.openWith", { app: openers.office }), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconEditOutline16, {}) });
    }
    if (openers.code !== void 0) {
      entries.push({ id: "code", label: t("file.openWith", { app: openers.code }), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCodeOutline16, {}) });
    }
    entries.push({ id: "default", label: t("file.openDefault"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconRightUpOutline16, {}) });
    return entries;
  };
  const runMenuAction = (entry, action) => {
    setMenuEntry(null);
    if (action === "preview") {
      openPreview(entry.path);
      return;
    }
    if (action === "markdown") runOpen(entry, openInMarkdown);
    else if (action === "office") runOpen(entry, openInOffice);
    else if (action === "code") runOpen(entry, openInCode);
    else runOpen(entry, openPath);
  };
  const renderLevel = (path, depth) => {
    const level = levels[path];
    const isLoading = loading[path] === true;
    const error = errors[path];
    const pad = { paddingLeft: depth * 14 + 10 };
    if (error !== void 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: WorkspaceFilesPanel_default.row, style: pad, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.errorText, children: t("tree.error") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: WorkspaceFilesPanel_default.inlineButton, onClick: () => {
            ensureLoaded(path);
          }, children: t("tree.retry") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: WorkspaceFilesPanel_default.rowError, style: pad, children: error })
      ] }, path);
    }
    if (level === void 0) {
      return isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: WorkspaceFilesPanel_default.row, style: pad, children: t("tree.loading") }, path) : null;
    }
    const visible = level.entries.filter((entry) => !entry.hidden || showHidden);
    if (visible.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: WorkspaceFilesPanel_default.row, style: pad, children: t("tree.empty") }, path);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: visible.map((entry) => {
      if (entry.kind === "dir") {
        const open = expanded[entry.path] === true;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: WorkspaceFilesPanel_default.row,
              style: pad,
              "data-dir": true,
              role: "button",
              tabIndex: 0,
              "aria-expanded": open,
              title: entry.path,
              onClick: () => {
                toggle(entry.path);
              },
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(entry.path);
                }
              },
              children: [
                open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: WorkspaceFilesPanel_default.chevron }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronRightOutline14, { className: WorkspaceFilesPanel_default.chevron }),
                open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconFolderOpen16, { className: WorkspaceFilesPanel_default.folderIcon }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconFolderClose16, { className: WorkspaceFilesPanel_default.folderIcon }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.rowName, children: entry.name })
              ]
            }
          ),
          open && renderLevel(entry.path, depth + 1)
        ] }, entry.path);
      }
      const action = primaryAction(entry);
      if (passThrough) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: `${WorkspaceFilesPanel_default.row} ${WorkspaceFilesPanel_default.rowButton}`,
            style: pad,
            "data-file": true,
            title: `${entry.path}
${t("file.singleHint", { action: action.label })}`,
            onClick: () => {
              action.run();
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.rowSpacer }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileGlyph, { kind: fileKindOf(entry.name) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.rowName, children: entry.name })
            ]
          }
        ) }, entry.path);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: WorkspaceFilesPanel_default.row,
          style: pad,
          "data-file": true,
          role: "button",
          tabIndex: 0,
          title: `${entry.path}
${t("file.openHint", { action: action.label })}`,
          onClick: (e) => {
            if (e.detail === 2) action.run();
          },
          onKeyDown: (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            action.run();
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.rowSpacer }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileGlyph, { kind: fileKindOf(entry.name) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.rowName, children: entry.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Menu,
              {
                open: menuEntry?.path === entry.path,
                portal: true,
                align: "start",
                side: "bottom",
                autoFocus: true,
                items: menuItems(entry),
                onSelect: (id) => {
                  runMenuAction(entry, id);
                },
                onClose: () => {
                  setMenuEntry(null);
                },
                anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    className: WorkspaceFilesPanel_default.rowMenu,
                    "aria-label": t("file.menuAria", { name: entry.name }),
                    title: t("file.menuAria", { name: entry.name }),
                    onClick: (e) => {
                      e.stopPropagation();
                      setMenuEntry((prev) => prev?.path === entry.path ? null : entry);
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconEllipsisOutline16, {})
                  }
                )
              }
            )
          ]
        }
      ) }, entry.path);
    }) }, path);
  };
  const rootName = (0, import_react.useMemo)(() => basenameOf(root), [root]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: WorkspaceFilesPanel_default.tree, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: WorkspaceFilesPanel_default.treeToolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.treeRoot, title: root, children: rootName || root }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: WorkspaceFilesPanel_default.iconButton,
          "aria-label": t("setup.button"),
          title: t("setup.button"),
          onClick: () => {
            onConfigure();
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSettingsOutline14, {})
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: WorkspaceFilesPanel_default.iconButton,
          "aria-label": t("refresh"),
          title: t("refresh"),
          onClick: () => {
            refresh();
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconRefreshOutline14, {})
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: WorkspaceFilesPanel_default.iconButton,
          "aria-pressed": showHidden,
          title: showHidden ? t("tree.hideHidden") : t("tree.showHidden"),
          onClick: () => {
            setShowHidden((prev) => !prev);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutline16, {})
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: WorkspaceFilesPanel_default.treeBody, children: renderLevel(root, 0) }),
    failure !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: WorkspaceFilesPanel_default.actionError, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_default.actionErrorText, children: t("action.failed", { message: failure.message }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: WorkspaceFilesPanel_default.inlineButton,
          onClick: () => {
            const { retry } = failure;
            setFailure(null);
            retry();
          },
          children: t("action.retry")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: WorkspaceFilesPanel_default.inlineButton,
          onClick: () => {
            const path = failure.path;
            setFailure(null);
            runOpen({ name: basenameOf(path), path, kind: "file", hidden: false }, openPath);
          },
          children: t("action.fallback")
        }
      )
    ] })
  ] });
}

// plugins/dsh-workspace-files/src/client/setup-dialog.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
var ROWS = [
  { id: "typora", label: "Typora", role: ".md .markdown" },
  { id: "marktext", label: "MarkText", role: ".md .markdown" },
  { id: "vscode", label: "VS Code", role: "\u4EE3\u7801 / \u6587\u672C\u6587\u4EF6" },
  { id: "wps", label: "WPS Office", role: "\u6587\u6863\u7C7B\u6587\u4EF6" }
];
function seedRow(id, state) {
  const slots = ["markdown", "code", "office"];
  for (const slot of slots) {
    const entry = state?.apps?.[slot];
    if (entry?.id === id) return { enabled: entry.enabled, path: entry.command, found: true };
  }
  return { enabled: false, path: "", found: false };
}
function usable(row) {
  return row !== void 0 && row.enabled && row.path.trim() !== "";
}
function SetupDialog(props) {
  const { open, state, t, scan, save, onSaved, onClose } = props;
  const [step, setStep] = (0, import_react2.useState)("ask");
  const [rows, setRows] = (0, import_react2.useState)(() => ({}));
  const [error, setError] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [deep, setDeep] = (0, import_react2.useState)(false);
  const [truncated, setTruncated] = (0, import_react2.useState)("");
  const controller = (0, import_react2.useMemo)(() => ({ current: null }), []);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    const seeded = {};
    for (const row of ROWS) seeded[row.id] = seedRow(row.id, state);
    setRows(seeded);
    setStep("ask");
    setError(null);
    setTruncated("");
    setBusy(false);
    setDeep(false);
  }, [open, state]);
  const patch = (id, change) => {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id] ?? { enabled: false, path: "", found: false }, ...change } }));
  };
  const runScan = async (walkDrives) => {
    const abort = new AbortController();
    controller.current = abort;
    setStep("scanning");
    setError(null);
    setDeep(walkDrives);
    try {
      const result = await scan(walkDrives, abort.signal);
      setRows((prev) => {
        const next = { ...prev };
        for (const found of result.found) {
          next[found.id] = { enabled: true, path: found.command, found: true };
        }
        return next;
      });
      setTruncated(result.truncated);
      setStep("result");
    } catch (reason) {
      if (abort.signal.aborted) {
        setStep("result");
        setTruncated("");
        return;
      }
      setError(reason instanceof Error ? reason.message : String(reason));
      setStep("result");
    }
  };
  const commit = async (forceOff) => {
    setBusy(true);
    setError(null);
    const apps = {};
    if (!forceOff) {
      if (usable(rows.typora)) apps.markdown = { id: "typora", label: "Typora", command: rows.typora.path.trim(), enabled: true };
      else if (usable(rows.marktext)) apps.markdown = { id: "marktext", label: "MarkText", command: rows.marktext.path.trim(), enabled: true };
      if (usable(rows.vscode)) apps.code = { id: "vscode", label: "VS Code", command: rows.vscode.path.trim(), enabled: true };
      if (usable(rows.wps)) apps.office = { id: "wps", label: "WPS Office", command: rows.wps.path.trim(), enabled: true };
    }
    const next = {
      version: 1,
      status: Object.keys(apps).length === 0 ? "off" : "ready",
      apps
    };
    try {
      const stored = await save(next);
      setBusy(false);
      onSaved(stored);
    } catch (reason) {
      setBusy(false);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  let body;
  if (step === "ask") {
    body = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: WorkspaceFilesPanel_default.setupBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupQuestion, children: t("setup.ask") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupHint, children: t("setup.askHint") })
    ] });
  } else if (step === "scanning") {
    body = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: WorkspaceFilesPanel_default.setupBody, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupQuestion, children: deep ? t("setup.scanningDeep") : t("setup.scanning") }) });
  } else {
    body = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: WorkspaceFilesPanel_default.setupBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("table", { className: WorkspaceFilesPanel_default.setupTable, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: ROWS.map((row) => {
        const value = rows[row.id] ?? { enabled: false, path: "", found: false };
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: WorkspaceFilesPanel_default.setupCheckCell, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "checkbox",
              checked: value.enabled,
              "aria-label": `${t("setup.use")} ${row.label}`,
              onChange: (event) => {
                patch(row.id, { enabled: event.target.checked });
              }
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: WorkspaceFilesPanel_default.setupNameCell, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: WorkspaceFilesPanel_default.setupName, children: row.label }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: WorkspaceFilesPanel_default.setupRole, children: row.role })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "text",
              className: WorkspaceFilesPanel_default.setupInput,
              value: value.path,
              placeholder: t("setup.placeholder"),
              "aria-label": `${row.label} ${t("setup.path")}`,
              onChange: (event) => {
                patch(row.id, { path: event.target.value, found: false });
              }
            }
          ) })
        ] }, row.id);
      }) }) }),
      truncated !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupWarn, children: t("setup.truncated", { reason: truncated }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupHint, children: t("setup.note.markdown") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupHint, children: t("setup.note.office") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupHint, children: t("setup.note.off") })
    ] });
  }
  const footer = (() => {
    if (step === "ask") {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: WorkspaceFilesPanel_default.setupFooter, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", onClick: () => {
          void commit(true);
        }, disabled: busy, children: t("setup.decline") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", onClick: () => {
          setStep("result");
        }, disabled: busy, children: t("setup.manual") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { onClick: () => {
          void runScan(false);
        }, disabled: busy, children: t("setup.scan") })
      ] });
    }
    if (step === "scanning") {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: WorkspaceFilesPanel_default.setupFooter, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_dsh_client_ui_primitives2.Button,
        {
          variant: "outline",
          onClick: () => {
            controller.current?.abort();
          },
          children: t("setup.cancel")
        }
      ) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: WorkspaceFilesPanel_default.setupFooter, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", onClick: () => {
        void commit(true);
      }, disabled: busy, children: t("setup.decline") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", onClick: () => {
        void runScan(true);
      }, disabled: busy, children: t("setup.scanDeep") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { onClick: () => {
        void commit(false);
      }, disabled: busy, children: busy ? t("setup.saving") : t("setup.save") })
    ] });
  })();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    import_dsh_client_ui_primitives2.Modal,
    {
      open,
      onClose,
      closeLabel: t("setup.cancel"),
      title: t("setup.title"),
      footer,
      children: [
        error !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: WorkspaceFilesPanel_default.setupError, children: t("setup.error", { message: error }) }),
        body
      ]
    }
  );
}

// plugins/dsh-workspace-files/src/client/panel.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function openerLabel(state, slot) {
  const entry = state?.apps[slot];
  return entry !== void 0 && entry.enabled && entry.command.trim() !== "" ? entry.label : void 0;
}
function WorkspaceFilesPanel(props) {
  const {
    useSessions,
    useTabInfo,
    sessionId,
    t,
    list,
    readState,
    scanApps,
    saveState,
    openPath,
    openInCode,
    openInMarkdown,
    openInOffice
  } = props;
  const cwd = useSessions((store) => store.byId[sessionId]?.cwd);
  const { tab } = useTabInfo();
  const [state, setState] = (0, import_react3.useState)(null);
  const [setupOpen, setSetupOpen] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    const controller = new AbortController();
    void readState(controller.signal).then(
      (stored) => {
        if (controller.signal.aborted) return;
        setState(stored);
        if (stored.status === "pending") setSetupOpen(true);
      },
      () => {
        if (!controller.signal.aborted) setState({ version: 1, status: "off", apps: {} });
      }
    );
    return () => {
      controller.abort();
    };
  }, [readState]);
  const openPreview = (path) => {
    tab.actions.openResource(sessionFileAddress(sessionId, path.replace(/\\/g, "/")));
  };
  const openers = {
    markdown: openerLabel(state, "markdown"),
    code: openerLabel(state, "code"),
    office: openerLabel(state, "office")
  };
  const passThrough = state === null || state.status !== "ready";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: WorkspaceFilesPanel_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: WorkspaceFilesPanel_default.body, children: cwd === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: WorkspaceFilesPanel_default.empty, children: t("tree.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      FileTree,
      {
        root: cwd,
        list,
        openPath,
        openInCode,
        openInMarkdown,
        openInOffice,
        openers,
        passThrough,
        onConfigure: () => {
          setSetupOpen(true);
        },
        openPreview,
        t
      },
      cwd
    ) }),
    state?.status === "off" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: WorkspaceFilesPanel_default.notice, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: WorkspaceFilesPanel_default.noticeText, children: t("setup.offNotice") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: WorkspaceFilesPanel_default.inlineButton, onClick: () => {
        setSetupOpen(true);
      }, children: t("setup.offReopen") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      SetupDialog,
      {
        open: setupOpen,
        state,
        t,
        scan: scanApps,
        save: saveState,
        onSaved: (stored) => {
          setState(stored);
          setSetupOpen(false);
        },
        onClose: () => {
          setSetupOpen(false);
        }
      }
    )
  ] });
}

// plugins/dsh-workspace-files/src/client/locales.ts
var zh = {
  "panel.title": "\u5DE5\u4F5C\u533A\u6587\u4EF6",
  "panel.close": "\u5173\u95ED\u9762\u677F",
  "guide.description": "\u6D4F\u89C8\u5F53\u524D\u4F1A\u8BDD\u7684\u5DE5\u4F5C\u533A\u6587\u4EF6\uFF1A\u53CC\u51FB\u7528\u4F60\u914D\u7F6E\u7684\u8F6F\u4EF6\u6253\u5F00\uFF0C\u300C\u22EF\u300D\u53EF\u9009\u5176\u4ED6\u6253\u5F00\u65B9\u5F0F",
  "tab.files": "\u6587\u4EF6",
  "tab.tool": "\u5DE5\u5177",
  "root.open": "\u5728\u9ED8\u8BA4\u5E94\u7528\u4E2D\u6253\u5F00",
  "tree.loading": "\u6B63\u5728\u52A0\u8F7D\u2026",
  "tree.empty": "\uFF08\u7A7A\u76EE\u5F55\uFF09",
  "tree.error": "\u65E0\u6CD5\u8BFB\u53D6\u76EE\u5F55",
  "tree.retry": "\u91CD\u8BD5",
  "tree.showHidden": "\u663E\u793A\u9690\u85CF\u6587\u4EF6",
  "tree.hideHidden": "\u9690\u85CF\u9690\u85CF\u6587\u4EF6",
  "refresh": "\u5237\u65B0",
  "file.menuAria": "\u6587\u4EF6\u201C{name}\u201D\u7684\u6253\u5F00\u65B9\u5F0F",
  "file.openWith": "\u7528 {app} \u6253\u5F00",
  "file.openCode": "\u5728 VS Code \u4E2D\u6253\u5F00",
  "file.openMarkdown": "\u7528 Markdown \u7F16\u8F91\u5668\u6253\u5F00",
  "file.openOffice": "\u7528 WPS Office \u6253\u5F00",
  "file.openDefault": "\u7528\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00",
  "file.openPreview": "\u5728\u4FA7\u680F\u9884\u89C8",
  "file.openHint": "\u53CC\u51FB{action}",
  "file.singleHint": "\u5355\u51FB\u6253\u5F00\uFF1A{action}",
  "setup.button": "\u6253\u5F00\u65B9\u5F0F\u8BBE\u7F6E",
  "setup.title": "\u6253\u5F00\u65B9\u5F0F\u8BBE\u7F6E",
  "setup.ask": "\u662F\u5426\u5141\u8BB8\u81EA\u52A8\u67E5\u627E\u7535\u8111\u4E0A\u7684 Typora / MarkText / WPS Office / VS Code \u7684\u542F\u52A8\u8DEF\u5F84\uFF1F",
  "setup.askHint": "\u67E5\u627E\u53EA\u8BFB\u53D6\u8FD9\u4E9B\u8F6F\u4EF6\u7684\u5B89\u88C5\u4F4D\u7F6E\uFF08\u914D\u7F6E\u3001PATH\u3001\u6CE8\u518C\u8868\u3001\u5E38\u89C1\u5B89\u88C5\u76EE\u5F55\uFF09\uFF0C\u4E0D\u4F1A\u4FEE\u6539\u4EFB\u4F55\u7CFB\u7EDF\u8BBE\u7F6E\u3002",
  "setup.scan": "\u81EA\u52A8\u67E5\u627E",
  "setup.scanDeep": "\u518D\u5168\u76D8\u627E\u4E00\u6B21",
  "setup.manual": "\u6211\u81EA\u5DF1\u586B\u5199\u8DEF\u5F84",
  "setup.decline": "\u4E0D\u914D\u7F6E\uFF0C\u4FDD\u6301\u539F\u6837",
  "setup.scanning": "\u6B63\u5728\u67E5\u627E\u2026",
  "setup.scanningDeep": "\u6B63\u5728\u5168\u76D8\u67E5\u627E\uFF08\u53EF\u80FD\u8981\u51E0\u5206\u949F\uFF0C\u53EF\u968F\u65F6\u53D6\u6D88\uFF09\u2026",
  "setup.cancel": "\u53D6\u6D88",
  "setup.scanningAborted": "\u5DF2\u53D6\u6D88\u67E5\u627E",
  "setup.truncated": "\u5168\u76D8\u67E5\u627E\u63D0\u524D\u7ED3\u675F\uFF08{reason}\uFF09\uFF0C\u53EF\u80FD\u8FD8\u6709\u8F6F\u4EF6\u6CA1\u627E\u5230",
  "setup.use": "\u4F7F\u7528",
  "setup.path": "\u542F\u52A8\u8DEF\u5F84",
  "setup.placeholder": "\u7559\u7A7A = \u4E0D\u4F7F\u7528\uFF1B\u4F8B\u5982 D:\\Typora\\Typora\\Typora.exe",
  "setup.note.markdown": "Typora \u4E0E MarkText \u90FD\u52FE\u9009\u65F6\u4F18\u5148 Typora",
  "setup.note.office": "WPS \u8D1F\u8D23\u6587\u6863\u7C7B\u6587\u4EF6\uFF1A.doc .docx .xls .xlsx .ppt .pptx .pdf .txt .csv .rtf",
  "setup.note.off": "\u5168\u90E8\u53D6\u6D88\u52FE\u9009\u5E76\u7559\u7A7A = \u4E0D\u914D\u7F6E\uFF1A\u672C\u63D2\u4EF6\u4E0D\u6539\u52A8 Harness \u7684\u6587\u4EF6\u6253\u5F00\u65B9\u5F0F",
  "setup.save": "\u4FDD\u5B58",
  "setup.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "setup.error": "\u64CD\u4F5C\u5931\u8D25\uFF1A{message}",
  "setup.offNotice": "\u672C\u63D2\u4EF6\u672A\u914D\u7F6E\u4EFB\u4F55\u8F6F\u4EF6\uFF0C\u6587\u4EF6\u4E00\u5F8B\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00\u3002",
  "setup.offReopen": "\u91CD\u65B0\u8BBE\u7F6E",
  "action.failed": "\u6253\u5F00\u5931\u8D25\uFF1A{message}",
  "action.retry": "\u91CD\u8BD5",
  "action.fallback": "\u6539\u7528\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00",
  "tool.empty": "\u6682\u65E0\u5DE5\u5177\u8C03\u7528",
  "tool.listAria": "\u5DE5\u5177\u8C03\u7528\u5217\u8868",
  "tool.callAria": "\u67E5\u770B\u5DE5\u5177\u8C03\u7528\u201C{name}\u201D",
  "tool.args": "\u8F93\u5165",
  "tool.output": "\u8F93\u51FA",
  "tool.running": "\u6267\u884C\u4E2D\u2026",
  "tool.error": "\u51FA\u9519",
  "tool.notInWindow": "\u8BE5\u8C03\u7528\u4E0D\u5728\u5F53\u524D\u7A97\u53E3\u5185"
};
var en = {
  "panel.title": "Workspace Files",
  "panel.close": "Close panel",
  "guide.description": "Browse the current session's workspace files: double-click opens with the app you configured, or use \u201C\u22EF\u201D to pick another",
  "tab.files": "Files",
  "tab.tool": "Tools",
  "root.open": "Open in default app",
  "tree.loading": "Loading\u2026",
  "tree.empty": "(empty directory)",
  "tree.error": "Cannot read directory",
  "tree.retry": "Retry",
  "tree.showHidden": "Show hidden files",
  "tree.hideHidden": "Hide hidden files",
  "refresh": "Refresh",
  "file.menuAria": "Open actions for \u201C{name}\u201D",
  "file.openWith": "Open with {app}",
  "file.openCode": "Open in VS Code",
  "file.openMarkdown": "Open with a Markdown editor",
  "file.openOffice": "Open with WPS Office",
  "file.openDefault": "Open with default app",
  "file.openPreview": "Preview in sidebar",
  "file.openHint": "Double-click to {action}",
  "file.singleHint": "Click to {action}",
  "setup.button": "Open-with settings",
  "setup.title": "Open-with settings",
  "setup.ask": "May this plugin look for the launch paths of Typora / MarkText / WPS Office / VS Code on this computer?",
  "setup.askHint": "The lookup only reads where these applications are installed (config, PATH, registry, common install directories); it changes nothing on your system.",
  "setup.scan": "Look for them",
  "setup.scanDeep": "Search the whole disk",
  "setup.manual": "I will enter the paths myself",
  "setup.decline": "Do not configure anything",
  "setup.scanning": "Looking\u2026",
  "setup.scanningDeep": "Searching the whole disk (this can take minutes; you can cancel)\u2026",
  "setup.cancel": "Cancel",
  "setup.scanningAborted": "Lookup cancelled",
  "setup.truncated": "The disk search stopped early ({reason}); some applications may be missing",
  "setup.use": "Use",
  "setup.path": "Launch path",
  "setup.placeholder": "Empty = unused; e.g. D:\\Typora\\Typora\\Typora.exe",
  "setup.note.markdown": "Typora wins when both Typora and MarkText are enabled",
  "setup.note.office": "WPS Office handles document files: .doc .docx .xls .xlsx .ppt .pptx .pdf .txt .csv .rtf",
  "setup.note.off": "Clearing every path and check box = nothing configured: this plugin leaves Harness file opening untouched",
  "setup.save": "Save",
  "setup.saving": "Saving\u2026",
  "setup.error": "Failed: {message}",
  "setup.offNotice": "No application is configured, so every file opens with the system default app.",
  "setup.offReopen": "Configure again",
  "action.failed": "Open failed: {message}",
  "action.retry": "Retry",
  "action.fallback": "Open with default app instead",
  "tool.empty": "No tool calls yet",
  "tool.listAria": "Tool call list",
  "tool.callAria": "Inspect tool call \u201C{name}\u201D",
  "tool.args": "Input",
  "tool.output": "Output",
  "tool.running": "Running\u2026",
  "tool.error": "Error",
  "tool.notInWindow": "This call is not in the current window"
};

// plugins/dsh-workspace-files/src/client/index.ts
var NS = "workspace-files";
var ROUTE_PATH = "/workspace-files";
function parseListing(value) {
  if (typeof value !== "object" || value === null) throw new Error("workspace-files: malformed listing response");
  const listing = value;
  if (typeof listing.path !== "string" || !Array.isArray(listing.entries)) {
    throw new Error("workspace-files: malformed listing response");
  }
  const entries = listing.entries;
  const rows = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) throw new Error("workspace-files: malformed listing row");
    const row = entry;
    if (typeof row.name !== "string" || typeof row.path !== "string" || row.kind !== "dir" && row.kind !== "file" || typeof row.hidden !== "boolean") {
      throw new Error("workspace-files: malformed listing row");
    }
    rows.push({ name: row.name, path: row.path, kind: row.kind, hidden: row.hidden });
  }
  return { path: listing.path, entries: rows };
}
function parseState(value) {
  if (typeof value !== "object" || value === null) throw new Error("workspace-files: malformed state response");
  const record = value;
  if (record.status !== "pending" && record.status !== "ready" && record.status !== "off") {
    throw new Error("workspace-files: malformed state status");
  }
  const apps = {};
  if (typeof record.apps === "object" && record.apps !== null) {
    for (const slot of ["markdown", "code", "office"]) {
      const raw = record.apps[slot];
      if (typeof raw !== "object" || raw === null) continue;
      const entry = raw;
      if (typeof entry.id !== "string" || typeof entry.label !== "string" || typeof entry.command !== "string" || entry.command.length === 0) continue;
      apps[slot] = { id: entry.id, label: entry.label, command: entry.command, enabled: entry.enabled === true };
    }
  }
  return { version: 1, status: record.status, apps };
}
function parseScanResult(value) {
  if (typeof value !== "object" || value === null) throw new Error("workspace-files: malformed scan response");
  const record = value;
  if (!Array.isArray(record.found)) throw new Error("workspace-files: malformed scan response");
  const found = [];
  for (const row of record.found) {
    if (typeof row !== "object" || row === null) throw new Error("workspace-files: malformed scan row");
    const app = row;
    if (typeof app.id !== "string" || typeof app.label !== "string" || typeof app.command !== "string" || app.slot !== "markdown" && app.slot !== "code" && app.slot !== "office") {
      throw new Error("workspace-files: malformed scan row");
    }
    const source = app.source;
    if (source !== "config" && source !== "location" && source !== "path" && source !== "registry" && source !== "scan") {
      throw new Error("workspace-files: malformed scan row source");
    }
    found.push({ id: app.id, slot: app.slot, label: app.label, command: app.command, source });
  }
  return { found, truncated: typeof record.truncated === "string" ? record.truncated : "" };
}
async function callRoute(endpoint, payload, signal) {
  const response = await fetch(`${ROUTE_PATH}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    ...signal === void 0 ? {} : { signal }
  });
  const result = await response.json().catch(() => void 0);
  if (!response.ok) {
    throw new Error(typeof result?.error?.message === "string" ? result.error.message : `workspace-files: ${endpoint} failed with HTTP ${response.status}`);
  }
  if (result?.ok !== true) {
    const message = typeof result?.error?.message === "string" ? result.error.message : `workspace-files: ${endpoint} failed`;
    throw new Error(message);
  }
  return result.value;
}
var inject = ["slots", "locale", "sidebarRightTabs"];
var TAB_ID = "@deepseek-ai/dsh-workspace-files";
var TAB_KIND = "files";
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "workspace-files: dictionaries");
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => t("panel.title"),
    guide: [{
      order: 20,
      title: () => t("panel.title"),
      description: () => t("guide.description"),
      icon: import_dsh_client_ui_primitives3.IconFolderClose16
    }]
  }), "workspace-files: tab type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: TAB_ID,
    locale: NS,
    inject: () => ({
      list: (path, signal) => callRoute("list", { path }, signal).then(parseListing),
      readState: (signal) => callRoute("state", {}, signal).then(parseState),
      scanApps: (deep, signal) => callRoute("scan", { deep }, signal).then(parseScanResult),
      saveState: (state) => callRoute("save", state, void 0).then(parseState),
      openPath: (path) => callRoute("open-default", { path }).then(() => void 0),
      openInCode: (path) => callRoute("open-in-code", { path }).then(() => void 0),
      openInMarkdown: (path) => callRoute("open-in-markdown", { path }).then(() => void 0),
      openInOffice: (path) => callRoute("open-in-office", { path }).then(() => void 0)
    })
  }, WorkspaceFilesPanel)), "workspace-files: tab body");
}
return module.exports; } });
