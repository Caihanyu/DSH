window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-ssh-files",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:d:\DeepSeek Harness\packages\extensions\dsh-ssh-files\src\client\SshFilesPanel.module.css.mjs
		const css = ".DKqtrq_root{flex-direction:column;height:100%;min-height:0;display:flex}.DKqtrq_header{border-bottom:1px solid var(--dsw-alias-border-l2,#e2e8f0);flex:none;align-items:center;gap:6px;padding:6px 8px;display:flex}.DKqtrq_modeBar{align-items:center;gap:2px;display:flex}.DKqtrq_modeTab{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:999px;padding:2px 10px;font-size:12px;line-height:20px}.DKqtrq_modeTab:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DKqtrq_modeTabActive{background:var(--dsw-alias-button-primary-fill,#2563eb);color:#fff}.DKqtrq_modeTabActive:hover{background:var(--dsw-alias-button-primary-hover,#1d4ed8);color:#fff}.DKqtrq_connBar{flex:1;align-items:center;gap:6px;min-width:0;display:flex}.DKqtrq_connInfo{color:var(--dsw-alias-label-secondary,#475569);text-overflow:ellipsis;white-space:nowrap;flex:1;align-items:center;gap:5px;min-width:0;font-size:12px;line-height:20px;display:flex;overflow:hidden}.DKqtrq_serverSelect{appearance:none;border:1px solid var(--dsw-alias-border-l2,#e2e8f0);color:var(--dsw-alias-label-primary,#0f172a);cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border-radius:6px;max-width:150px;padding:3px 10px;font-size:12px;line-height:20px;overflow:hidden}.DKqtrq_serverSelect:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DKqtrq_close{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:6px;place-items:center;width:24px;height:24px;display:grid}.DKqtrq_close:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DKqtrq_body{flex-direction:column;flex:1;min-height:0;display:flex;overflow:auto}.DKqtrq_empty{color:var(--dsw-alias-label-tertiary,#94a3b8);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:24px 16px;font-size:13px;line-height:20px;display:flex}.DKqtrq_errorText{color:var(--dsw-alias-state-error-primary,#dc2626);padding:6px 10px;font-size:12px;line-height:18px}.DKqtrq_iconButton{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;place-items:center;width:24px;height:24px;display:grid}.DKqtrq_iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#0000000d);color:var(--dsw-alias-label-primary,#0f172a)}.DKqtrq_iconButton:disabled{opacity:.45;cursor:default}.DKqtrq_treeRoot{flex-direction:column;flex:1;min-height:0;display:flex}.DKqtrq_treeToolbar{flex:none;align-items:center;gap:2px;padding:4px 6px;display:flex}.DKqtrq_toolbarButton{appearance:none;color:var(--dsw-alias-label-secondary,#475569);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:6px;align-items:center;gap:4px;padding:2px 8px;font-size:12px;line-height:18px;display:inline-flex}.DKqtrq_toolbarButton:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DKqtrq_tree{flex:1;min-height:0;padding-bottom:12px;overflow:auto}.DKqtrq_treeRow{align-items:center;height:26px;padding-right:6px;font-size:13px;line-height:20px;display:flex}.DKqtrq_treeRow:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DKqtrq_treeChevron{appearance:none;color:var(--dsw-alias-label-tertiary,#94a3b8);cursor:pointer;background:0 0;border:none;flex:none;place-items:center;width:18px;height:18px;display:grid}.DKqtrq_treeLabel{appearance:none;cursor:pointer;min-width:0;color:var(--dsw-alias-label-primary,#0f172a);background:0 0;border:none;flex:1;align-items:center;gap:5px;padding:0;font-size:13px;line-height:20px;display:flex}.DKqtrq_treeName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.DKqtrq_dirGlyph{color:var(--dsw-alias-state-business-primary,#2563eb);flex:none}.DKqtrq_fileGlyph{flex:none}.DKqtrq_parentLabel{color:var(--dsw-alias-label-tertiary,#94a3b8);width:14px;font-weight:600}.DKqtrq_treeError{color:var(--dsw-alias-state-error-primary,#dc2626);padding:2px 0;font-size:12px;line-height:18px}.DKqtrq_treeEmpty{color:var(--dsw-alias-label-tertiary,#94a3b8);padding:2px 0;font-size:12px;line-height:18px}.DKqtrq_loadingDot{background:var(--dsw-alias-label-tertiary,#94a3b8);border-radius:50%;width:8px;height:8px;animation:.9s ease-in-out infinite DKqtrq_ssh-files-pulse}@keyframes DKqtrq_ssh-files-pulse{0%,to{opacity:.3}50%{opacity:1}}.DKqtrq_editorRoot{flex-direction:column;flex:1;min-height:0;display:flex}.DKqtrq_editorHeader{border-bottom:1px solid var(--dsw-alias-border-l2,#e2e8f0);flex:none;align-items:center;gap:8px;padding:6px 8px;display:flex}.DKqtrq_editorPath{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary,#475569);text-align:left;direction:rtl;flex:1;font-size:12px;overflow:hidden}.DKqtrq_editorActions{flex:none;align-items:center;gap:6px;display:flex}.DKqtrq_editorDirty{color:var(--dsw-alias-state-warn-primary,#d97706);font-size:11px}.DKqtrq_editorStatus{color:var(--dsw-alias-label-tertiary,#94a3b8);padding:8px 12px;font-size:12px}.DKqtrq_editorError{color:var(--dsw-alias-state-error-primary,#dc2626);padding:6px 12px;font-size:12px;line-height:18px}.DKqtrq_editorSaved{background:var(--dsw-alias-state-success-primary,#16a34a);color:#fff;z-index:5;border-radius:999px;padding:3px 10px;font-size:12px;position:absolute;top:48px;right:16px}.DKqtrq_editorTextarea{resize:none;background:var(--dsw-alias-bg-base,#fff);width:100%;min-height:0;color:var(--dsw-alias-label-primary,#0f172a);tab-size:2;border:none;outline:none;flex:1;padding:10px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px}.DKqtrq_formGrid{flex-direction:column;gap:12px;min-width:320px;display:flex}.DKqtrq_formField{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.DKqtrq_formLabel{color:var(--dsw-alias-label-secondary,#475569);font-size:12px}.DKqtrq_formRow{gap:10px;display:flex}.DKqtrq_authSelect{appearance:none;border:1px solid var(--dsw-alias-border-l2,#e2e8f0);color:var(--dsw-alias-label-primary,#0f172a);cursor:pointer;text-align:left;background:0 0;border-radius:6px;padding:6px 10px;font-size:13px;line-height:20px}.DKqtrq_authSelect:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DKqtrq_formError{color:var(--dsw-alias-state-error-primary,#dc2626);font-size:12px;line-height:18px}.DKqtrq_serverList{flex-direction:column;gap:2px;min-width:320px;max-height:320px;display:flex;overflow:auto}.DKqtrq_serverRow{border-radius:6px;align-items:center;gap:8px;padding:6px 8px;display:flex}.DKqtrq_serverRow:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000d)}.DKqtrq_serverInfo{flex:1;align-items:center;gap:8px;min-width:0;display:flex}.DKqtrq_serverIcon{color:var(--dsw-alias-label-tertiary,#94a3b8);flex:none}.DKqtrq_serverText{min-width:0}.DKqtrq_serverName{color:var(--dsw-alias-label-primary,#0f172a);align-items:center;gap:6px;font-size:13px;line-height:20px;display:flex}.DKqtrq_serverMeta{color:var(--dsw-alias-label-tertiary,#94a3b8);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.DKqtrq_serverActions{flex:none;align-items:center;gap:2px;display:flex}.DKqtrq_connectedPill{font-size:11px}.DKqtrq_createDir{color:var(--dsw-alias-label-tertiary,#94a3b8);text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px;font-size:12px;overflow:hidden}.DKqtrq_deleteText{color:var(--dsw-alias-label-primary,#0f172a);min-width:260px;font-size:13px;line-height:20px}";
		const tagId = "@deepseek-ai/dsh-ssh-files/SshFilesPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-ssh-files";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SshFilesPanel_module_css_default = {
			"authSelect": "DKqtrq_authSelect",
			"body": "DKqtrq_body",
			"close": "DKqtrq_close",
			"connBar": "DKqtrq_connBar",
			"connInfo": "DKqtrq_connInfo",
			"connectedPill": "DKqtrq_connectedPill",
			"createDir": "DKqtrq_createDir",
			"deleteText": "DKqtrq_deleteText",
			"dirGlyph": "DKqtrq_dirGlyph",
			"editorActions": "DKqtrq_editorActions",
			"editorDirty": "DKqtrq_editorDirty",
			"editorError": "DKqtrq_editorError",
			"editorHeader": "DKqtrq_editorHeader",
			"editorPath": "DKqtrq_editorPath",
			"editorRoot": "DKqtrq_editorRoot",
			"editorSaved": "DKqtrq_editorSaved",
			"editorStatus": "DKqtrq_editorStatus",
			"editorTextarea": "DKqtrq_editorTextarea",
			"empty": "DKqtrq_empty",
			"errorText": "DKqtrq_errorText",
			"fileGlyph": "DKqtrq_fileGlyph",
			"formError": "DKqtrq_formError",
			"formField": "DKqtrq_formField",
			"formGrid": "DKqtrq_formGrid",
			"formLabel": "DKqtrq_formLabel",
			"formRow": "DKqtrq_formRow",
			"header": "DKqtrq_header",
			"iconButton": "DKqtrq_iconButton",
			"loadingDot": "DKqtrq_loadingDot",
			"modeBar": "DKqtrq_modeBar",
			"modeTab": "DKqtrq_modeTab",
			"modeTabActive": "DKqtrq_modeTabActive",
			"parentLabel": "DKqtrq_parentLabel",
			"root": "DKqtrq_root",
			"serverActions": "DKqtrq_serverActions",
			"serverIcon": "DKqtrq_serverIcon",
			"serverInfo": "DKqtrq_serverInfo",
			"serverList": "DKqtrq_serverList",
			"serverMeta": "DKqtrq_serverMeta",
			"serverName": "DKqtrq_serverName",
			"serverRow": "DKqtrq_serverRow",
			"serverSelect": "DKqtrq_serverSelect",
			"serverText": "DKqtrq_serverText",
			"ssh-files-pulse": "DKqtrq_ssh-files-pulse",
			"toolbarButton": "DKqtrq_toolbarButton",
			"tree": "DKqtrq_tree",
			"treeChevron": "DKqtrq_treeChevron",
			"treeEmpty": "DKqtrq_treeEmpty",
			"treeError": "DKqtrq_treeError",
			"treeLabel": "DKqtrq_treeLabel",
			"treeName": "DKqtrq_treeName",
			"treeRoot": "DKqtrq_treeRoot",
			"treeRow": "DKqtrq_treeRow",
			"treeToolbar": "DKqtrq_treeToolbar"
		};
		//#endregion
		//#region src/client/file-editor.tsx
		/**
		* FileEditor: the panel's read/write editor for one text file on the active
		* filesystem. Loads the content through the injected `read`, edits in a
		* plain textarea, and persists through `write` (temp + rename on the host).
		* A dirty close asks for confirmation instead of discarding silently.
		*/
		/** The editor. */
		function FileEditor({ path, read, write, onClose, t }) {
			const [content, setContent] = (0, react.useState)(null);
			const [original, setOriginal] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(true);
			const [readError, setReadError] = (0, react.useState)(null);
			const [saving, setSaving] = (0, react.useState)(false);
			const [saveError, setSaveError] = (0, react.useState)(null);
			const [savedFlash, setSavedFlash] = (0, react.useState)(false);
			const [confirmClose, setConfirmClose] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				setLoading(true);
				setReadError(null);
				read(path, controller.signal).then((text) => {
					setContent(text);
					setOriginal(text);
				}, (error) => {
					if (controller.signal.aborted) return;
					setReadError(error instanceof Error ? error.message : String(error));
				}).finally(() => {
					if (!controller.signal.aborted) setLoading(false);
				});
				return () => {
					controller.abort();
				};
			}, [path, read]);
			const dirty = content !== null && content !== original;
			const requestClose = () => {
				if (dirty) setConfirmClose(true);
				else onClose();
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SshFilesPanel_module_css_default.editorRoot,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: SshFilesPanel_module_css_default.editorHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SshFilesPanel_module_css_default.editorPath,
							title: path,
							children: path
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SshFilesPanel_module_css_default.editorActions,
							children: [
								dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SshFilesPanel_module_css_default.editorDirty,
									children: t("editor.dirty")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}),
									disabled: content === null || saving || !dirty,
									onClick: () => {
										save();
									},
									children: saving ? t("editor.saving") : t("editor.save")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.iconButton,
									"aria-label": t("editor.close"),
									title: t("editor.close"),
									onClick: requestClose,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
								})
							]
						})]
					}),
					loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.editorStatus,
						children: t("editor.loading")
					}),
					readError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.editorError,
						role: "alert",
						children: t("editor.readFailed", { message: readError })
					}),
					content !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						className: SshFilesPanel_module_css_default.editorTextarea,
						value: content,
						spellCheck: false,
						onChange: (event) => {
							setContent(event.target.value);
						},
						"aria-label": path
					}),
					saveError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.editorError,
						role: "alert",
						children: t("editor.saveFailed", { message: saveError })
					}),
					savedFlash && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.editorSaved,
						children: t("editor.saved")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: confirmClose,
						onClose: () => {
							setConfirmClose(false);
						},
						closeLabel: t("form.cancel"),
						title: t("editor.unsaved"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: () => {
								setConfirmClose(false);
							},
							children: t("form.cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							onClick: () => {
								setConfirmClose(false);
								onClose();
							},
							children: t("editor.close")
						})] })
					})
				]
			});
		}
		//#endregion
		//#region src/client/file-tree.tsx
		/**
		* FileTree: the panel's lazy, expandable directory tree. Rows load one
		* directory level at a time through the injected `list` (abort-guarded),
		* directories expand on click, files open the editor through `onOpenFile`.
		* A per-row menu offers local-mode desktop openers (VS Code / MarkText /
		* default app), create-in-directory, and delete. A leading ".." row navigates
		* to the parent directory, so the tree is not confined to its root.
		*/
		/** Parent of an absolute path, tolerant of both `/` and `\` separators. */
		function parentOf(path) {
			const trimmed = path.replace(/[\\/]+$/, "");
			const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
			if (index <= 0) return path;
			return trimmed.slice(0, index);
		}
		/** Small colored document glyph keyed by the row kind. */
		function FileGlyph({ kind }) {
			return kind === "dir" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { className: SshFilesPanel_module_css_default.dirGlyph }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				width: "15",
				height: "15",
				"aria-hidden": true,
				className: SshFilesPanel_module_css_default.fileGlyph,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
						fill: "var(--dsw-alias-label-tertiary, #94a3b8)",
						opacity: "0.18"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
						fill: "none",
						stroke: "var(--dsw-alias-label-tertiary, #94a3b8)",
						strokeWidth: "1.1"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M9 1.5v3.5h3.5",
						fill: "none",
						stroke: "var(--dsw-alias-label-tertiary, #94a3b8)",
						strokeWidth: "1.1"
					})
				]
			});
		}
		/** The recursive row: one entry with expansion/actions. */
		function TreeRow({ entry, depth, list, mode, showHidden, onOpenFile, onCreate, onDelete, onOpenLocal, t }) {
			const [children, setChildren] = (0, react.useState)(null);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
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
					setChildren((await list(entry.path)).entries);
				} catch (error) {
					setError(error instanceof Error ? error.message : String(error));
				} finally {
					setLoading(false);
				}
			};
			const menuItems = (0, react.useMemo)(() => {
				const items = [];
				if (entry.kind === "dir") items.push({
					id: "new-file",
					label: t("tree.newFile")
				}, {
					id: "new-dir",
					label: t("tree.newDir")
				});
				if (mode === "local") items.push({
					id: "open-code",
					label: t("tree.openCode")
				}, {
					id: "open-marktext",
					label: t("tree.openMarktext")
				}, {
					id: "open-default",
					label: t("tree.openDefault")
				});
				items.push({
					id: "delete",
					label: t("tree.delete"),
					danger: true
				});
				return items;
			}, [
				entry.kind,
				mode,
				t
			]);
			const onMenuSelect = (id) => {
				setMenuOpen(false);
				switch (id) {
					case "new-file":
						onCreate(entry.path, "file");
						break;
					case "new-dir":
						onCreate(entry.path, "dir");
						break;
					case "open-code":
						onOpenLocal(entry.path, "code");
						break;
					case "open-marktext":
						onOpenLocal(entry.path, "marktext");
						break;
					case "open-default":
						onOpenLocal(entry.path, "default");
						break;
					case "delete":
						onDelete(entry);
						break;
				}
			};
			const visibleChildren = showHidden ? children ?? [] : (children ?? []).filter((child) => !child.hidden);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${SshFilesPanel_module_css_default.treeRow} ${entry.kind === "dir" ? SshFilesPanel_module_css_default.treeRowDir : SshFilesPanel_module_css_default.treeRowFile}`,
				"data-kind": entry.kind,
				style: { paddingLeft: `${8 + depth * 14}px` },
				role: "treeitem",
				"aria-expanded": entry.kind === "dir" ? expanded : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: SshFilesPanel_module_css_default.treeChevron,
						"aria-hidden": true,
						tabIndex: -1,
						onClick: () => {
							toggle();
						},
						children: entry.kind === "dir" ? loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SshFilesPanel_module_css_default.loadingDot }) : expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {}) : null
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: SshFilesPanel_module_css_default.treeLabel,
						onClick: () => {
							toggle();
						},
						title: entry.path,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileGlyph, { kind: entry.kind }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SshFilesPanel_module_css_default.treeName,
							children: entry.name
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open: menuOpen,
						onClose: () => {
							setMenuOpen(false);
						},
						items: menuItems,
						onSelect: onMenuSelect,
						align: "end",
						portal: true,
						anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: SshFilesPanel_module_css_default.iconButton,
							"aria-haspopup": "menu",
							"aria-expanded": menuOpen,
							"aria-label": entry.name,
							onClick: () => {
								setMenuOpen(true);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
						})
					})
				]
			}), expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				role: "group",
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SshFilesPanel_module_css_default.treeError,
						style: { paddingLeft: `${24 + depth * 14}px` },
						children: [
							t("tree.error"),
							"：",
							error
						]
					}),
					visibleChildren.map((child) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TreeRow, {
						entry: child,
						depth: depth + 1,
						list,
						mode,
						showHidden,
						onOpenFile,
						onCreate,
						onDelete,
						onOpenLocal,
						t
					}, child.path)),
					visibleChildren.length === 0 && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.treeEmpty,
						style: { paddingLeft: `${24 + depth * 14}px` },
						children: t("tree.empty")
					})
				]
			})] });
		}
		/** The file tree: parent row plus recursive entries under the root. */
		function FileTree({ root, list, mode, onOpenFile, onCreate, onDelete, onOpenLocal, t }) {
			const [refreshKey, setRefreshKey] = (0, react.useState)(0);
			const [showHidden, setShowHidden] = (0, react.useState)(false);
			const [parentMenu, setParentMenu] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(null);
			const rootEntry = {
				name: root,
				path: root,
				kind: "dir",
				hidden: false
			};
			const parent = parentOf(root);
			const handleOpenLocal = (path, app) => {
				setFailure(null);
				return (app === "code" ? onOpenLocal(path, "code") : app === "marktext" ? onOpenLocal(path, "marktext") : onOpenLocal(path, "default")).catch((error) => {
					setFailure({
						path,
						message: error instanceof Error ? error.message : String(error)
					});
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SshFilesPanel_module_css_default.treeRoot,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SshFilesPanel_module_css_default.treeToolbar,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: SshFilesPanel_module_css_default.toolbarButton,
							onClick: () => {
								setRefreshKey((value) => value + 1);
							},
							title: t("tree.refresh"),
							"aria-label": t("tree.refresh"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline14, {})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: SshFilesPanel_module_css_default.toolbarButton,
							onClick: () => {
								setShowHidden((value) => !value);
							},
							title: showHidden ? t("tree.hideHidden") : t("tree.showHidden"),
							children: showHidden ? t("tree.showHidden") : t("tree.hideHidden")
						})]
					}),
					failure !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.treeError,
						role: "alert",
						children: t("tree.openFailed", { message: failure.message })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						role: "tree",
						"aria-label": root,
						className: SshFilesPanel_module_css_default.tree,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SshFilesPanel_module_css_default.treeRow,
							"data-kind": "dir",
							style: { paddingLeft: "8px" },
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
								open: parentMenu,
								onClose: () => {
									setParentMenu(false);
								},
								items: [{
									id: "new-file",
									label: t("tree.newFile")
								}, {
									id: "new-dir",
									label: t("tree.newDir")
								}],
								onSelect: (id) => {
									setParentMenu(false);
									if (id === "new-file") onCreate(parent, "file");
									if (id === "new-dir") onCreate(parent, "dir");
								},
								align: "end",
								portal: true,
								anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.treeLabel,
									onClick: () => {
										setParentMenu(true);
									},
									title: t("tree.parent"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: SshFilesPanel_module_css_default.parentLabel,
										children: ".."
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: SshFilesPanel_module_css_default.treeName,
										children: t("tree.parent")
									})]
								})
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TreeRow, {
							entry: rootEntry,
							depth: 0,
							list,
							mode,
							showHidden,
							onOpenFile,
							onCreate,
							onDelete,
							onOpenLocal: handleOpenLocal,
							t
						}, `${root}-${refreshKey}`)]
					})
				]
			});
		}
		//#endregion
		//#region src/client/server-manager.tsx
		/**
		* ServerManager: two modals — the server list (edit / delete / add) and the
		* add-or-edit form. The form collects name, host, port, username,
		* authentication strategy (password / private key / agent), and the initial
		* directory; the host validates and persists records.
		*/
		/** A fresh empty draft. */
		function emptyDraft() {
			return {
				name: "",
				host: "",
				port: "22",
				username: "",
				auth: "password",
				password: "",
				keyPath: "",
				root: ""
			};
		}
		/** Draft from an existing record (for editing). */
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
		/** The add-or-edit form modal. */
		function ServerFormModal({ initial, title, onSave, onCancel, t }) {
			const [draft, setDraft] = (0, react.useState)(initial);
			const [authMenu, setAuthMenu] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const set = (key, value) => {
				setDraft((current) => ({
					...current,
					[key]: value
				}));
			};
			const authLabel = (0, react.useMemo)(() => {
				switch (draft.auth) {
					case "password": return t("form.authPassword");
					case "key": return t("form.authKey");
					case "agent": return t("form.authAgent");
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
				} catch (error) {
					setError(error instanceof Error ? error.message : String(error));
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: onCancel,
				closeLabel: t("form.cancel"),
				title,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					onClick: onCancel,
					children: t("form.cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: busy,
					onClick: () => {
						submit();
					},
					children: t("form.save")
				})] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SshFilesPanel_module_css_default.formGrid,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.name")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: draft.name,
								placeholder: t("form.namePlaceholder"),
								onChange: (event) => {
									set("name", event.target.value);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.host")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: draft.host,
								placeholder: t("form.hostPlaceholder"),
								onChange: (event) => {
									set("host", event.target.value);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SshFilesPanel_module_css_default.formRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: SshFilesPanel_module_css_default.formField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SshFilesPanel_module_css_default.formLabel,
									children: t("form.port")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									value: draft.port,
									inputMode: "numeric",
									onChange: (event) => {
										set("port", event.target.value);
									}
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: SshFilesPanel_module_css_default.formField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SshFilesPanel_module_css_default.formLabel,
									children: t("form.username")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									value: draft.username,
									onChange: (event) => {
										set("username", event.target.value);
									}
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.auth")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
								open: authMenu,
								onClose: () => {
									setAuthMenu(false);
								},
								items: [
									{
										id: "password",
										label: t("form.authPassword")
									},
									{
										id: "key",
										label: t("form.authKey")
									},
									{
										id: "agent",
										label: t("form.authAgent")
									}
								],
								selectedId: draft.auth,
								onSelect: (id) => {
									setAuthMenu(false);
									setDraft((current) => ({
										...current,
										auth: id
									}));
								},
								align: "end",
								portal: true,
								anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.authSelect,
									onClick: () => {
										setAuthMenu(true);
									},
									children: authLabel
								})
							})]
						}),
						draft.auth === "password" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.password")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								type: "password",
								value: draft.password,
								placeholder: t("form.passwordPlaceholder"),
								onChange: (event) => {
									set("password", event.target.value);
								}
							})]
						}),
						draft.auth === "key" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.keyPath")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: draft.keyPath,
								placeholder: t("form.keyPathPlaceholder"),
								onChange: (event) => {
									set("keyPath", event.target.value);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SshFilesPanel_module_css_default.formField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SshFilesPanel_module_css_default.formLabel,
								children: t("form.root")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: draft.root,
								placeholder: t("form.rootPlaceholder"),
								onChange: (event) => {
									set("root", event.target.value);
								}
							})]
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SshFilesPanel_module_css_default.formError,
							role: "alert",
							children: error
						})
					]
				})
			});
		}
		/** The server list manager with add/edit/delete. */
		function ServerManager({ open, onClose, servers, activeServerId, addServer, updateServer, removeServer, t }) {
			const [editing, setEditing] = (0, react.useState)(null);
			const [busyId, setBusyId] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const startAdd = () => {
				setError(null);
				setEditing({
					id: null,
					draft: emptyDraft()
				});
			};
			const startEdit = (server) => {
				setError(null);
				setEditing({
					id: server.id,
					draft: draftFromServer(server)
				});
			};
			const handleSave = async (input) => {
				if (editing === null) return;
				if (editing.id === null) await addServer(input);
				else await updateServer(editing.id, input);
				setEditing(null);
			};
			const handleDelete = async (server) => {
				if (!window.confirm(t("manage.deleteConfirm", { name: server.name }))) return;
				setBusyId(server.id);
				setError(null);
				try {
					await removeServer(server.id);
				} catch (error) {
					setError(error instanceof Error ? error.message : String(error));
				} finally {
					setBusyId(null);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: open && editing === null,
				onClose,
				closeLabel: t("form.cancel"),
				title: t("manage.title"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}),
					onClick: startAdd,
					children: t("manage.add")
				}),
				children: [
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.formError,
						role: "alert",
						children: error
					}),
					servers.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.empty,
						children: t("manage.empty")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SshFilesPanel_module_css_default.serverList,
						children: servers.map((server) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SshFilesPanel_module_css_default.serverRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SshFilesPanel_module_css_default.serverInfo,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconGlobeOutline14, { className: SshFilesPanel_module_css_default.serverIcon }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: SshFilesPanel_module_css_default.serverText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: SshFilesPanel_module_css_default.serverName,
										children: [server.name, server.id === activeServerId && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: true,
											className: SshFilesPanel_module_css_default.connectedPill,
											children: t("conn.connected")
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: SshFilesPanel_module_css_default.serverMeta,
										children: [
											server.username,
											"@",
											server.host,
											":",
											server.port
										]
									})]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SshFilesPanel_module_css_default.serverActions,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.iconButton,
									"aria-label": t("manage.edit"),
									title: t("manage.edit"),
									onClick: () => {
										startEdit(server);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.iconButton,
									"aria-label": t("manage.delete"),
									title: t("manage.delete"),
									disabled: busyId === server.id,
									onClick: () => {
										handleDelete(server);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
								})]
							})]
						}, server.id))
					})
				]
			}), editing !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServerFormModal, {
				initial: editing.draft,
				title: editing.id === null ? t("form.titleAdd") : t("form.titleEdit"),
				onSave: handleSave,
				onCancel: () => {
					setEditing(null);
				},
				t
			})] });
		}
		//#endregion
		//#region src/client/panel.tsx
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
		/** Join a directory and a name with `/` (Node fs and SFTP both accept `/` on every platform). */
		function joinPath(dir, name) {
			return dir.endsWith("/") || dir.endsWith("\\") ? dir + name : `${dir}/${name}`;
		}
		/** The details panel. */
		function SshFilesPanel(props) {
			const { useSessions, sessionId: sid, t, openDetails, closeDetails, getState, setMode, addServer, updateServer, removeServer, connect, disconnect, list, read, write, mkdir, unlink, openNewSessionOn, openLocalDefault, openLocalCode, openLocalMarktext } = props;
			const cwd = useSessions((store) => store.byId[sid]?.cwd);
			const [response, setResponse] = (0, react.useState)(null);
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [connectingId, setConnectingId] = (0, react.useState)(null);
			const [connectError, setConnectError] = (0, react.useState)(null);
			const [selectedId, setSelectedId] = (0, react.useState)(null);
			const [serverMenuOpen, setServerMenuOpen] = (0, react.useState)(false);
			const [manageOpen, setManageOpen] = (0, react.useState)(false);
			const [openFile, setOpenFile] = (0, react.useState)(null);
			const [createTarget, setCreateTarget] = (0, react.useState)(null);
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
			const [newName, setNewName] = (0, react.useState)("");
			const [createBusy, setCreateBusy] = (0, react.useState)(false);
			const [createError, setCreateError] = (0, react.useState)(null);
			const [deleteBusy, setDeleteBusy] = (0, react.useState)(false);
			const [deleteError, setDeleteError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				openDetails();
			}, [openDetails]);
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				setLoadError(null);
				getState(sid, controller.signal).then(setResponse, (error) => {
					if (controller.signal.aborted) return;
					setLoadError(error instanceof Error ? error.message : String(error));
				});
				return () => {
					controller.abort();
				};
			}, [getState, sid]);
			const mode = response?.state.mode ?? "local";
			const connected = response?.state.connected ?? false;
			const activeServer = (0, react.useMemo)(() => response?.state.servers.find((server) => server.id === response.state.serverId) ?? null, [response]);
			const selectedServer = (0, react.useMemo)(() => response?.state.servers.find((server) => server.id === (selectedId ?? response.state.serverId)) ?? null, [response, selectedId]);
			/** Tree base: session cwd in local mode, the server root when connected. */
			const localRoot = cwd;
			const sshRoot = response?.root ?? null;
			const handleSetMode = async (next) => {
				if (next === mode) return;
				setOpenFile(null);
				setConnectError(null);
				try {
					setResponse(await setMode(sid, next));
				} catch (error) {
					setConnectError(error instanceof Error ? error.message : String(error));
				}
			};
			const autoConnectTried = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (autoConnectTried.current) return;
				if (response === null || loadError !== null) return;
				const st = response.state;
				if (st.mode !== "ssh" || st.serverId === null || st.connected) return;
				if (st.servers.find((candidate) => candidate.id === st.serverId) === void 0) return;
				autoConnectTried.current = true;
				setConnectingId(st.serverId);
				connect(sid, st.serverId).then(setResponse, (error) => {
					autoConnectTried.current = false;
					setConnectError(error instanceof Error ? error.message : String(error));
				}).finally(() => {
					setConnectingId(null);
				});
			}, [
				response,
				loadError,
				connect
			]);
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
			/** Open the current workspace's New-Session view defaulted to this server. */
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
					if (createTarget.kind === "file") await write(sid, target, "");
					else await mkdir(sid, target);
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
			const openLocalAction = (app) => app === "code" ? openLocalCode : app === "marktext" ? openLocalMarktext : openLocalDefault;
			/** FileTree's per-row opener: choose the app from the row menu's id. */
			const handleOpenLocal = (path, app) => openLocalAction(app)(path);
			const serverMenuItems = (response?.state.servers ?? []).map((server) => ({
				id: server.id,
				label: `${server.name}（${server.username}@${server.host}）`
			}));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SshFilesPanel_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: SshFilesPanel_module_css_default.header,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SshFilesPanel_module_css_default.modeBar,
								role: "tablist",
								"aria-label": t("mode.tip"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									"aria-selected": mode === "local",
									className: mode === "local" ? `${SshFilesPanel_module_css_default.modeTab} ${SshFilesPanel_module_css_default.modeTabActive}` : SshFilesPanel_module_css_default.modeTab,
									onClick: () => {
										handleSetMode("local");
									},
									children: t("mode.local")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									"aria-selected": mode === "ssh",
									className: mode === "ssh" ? `${SshFilesPanel_module_css_default.modeTab} ${SshFilesPanel_module_css_default.modeTabActive}` : SshFilesPanel_module_css_default.modeTab,
									onClick: () => {
										handleSetMode("ssh");
									},
									children: t("mode.ssh")
								})]
							}),
							mode === "ssh" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SshFilesPanel_module_css_default.connBar,
								children: [connected && activeServer !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: SshFilesPanel_module_css_default.connInfo,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "done" }), t("conn.connectedTo", { name: activeServer.name })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}),
										title: t("conn.newSessionOn"),
										onClick: () => {
											handleNewSessionOn(activeServer.id);
										},
										children: t("conn.newSessionOn")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											handleDisconnect();
										},
										children: t("conn.disconnect")
									})
								] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
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
									anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: SshFilesPanel_module_css_default.serverSelect,
										onClick: () => {
											setServerMenuOpen(true);
										},
										children: selectedServer?.name ?? t("conn.select")
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									disabled: selectedServer === null || connectingId !== null,
									onClick: () => {
										if (selectedServer !== null) handleConnect(selectedServer.id);
									},
									children: connectingId !== null ? t("conn.connecting") : t("conn.connect")
								})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: SshFilesPanel_module_css_default.iconButton,
									"aria-label": t("conn.manage"),
									title: t("conn.manage"),
									onClick: () => {
										setManageOpen(true);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline14, {})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: SshFilesPanel_module_css_default.close,
								"aria-label": t("panel.close"),
								title: t("panel.close"),
								onClick: () => {
									closeDetails();
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SshFilesPanel_module_css_default.body,
						children: [
							loadError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SshFilesPanel_module_css_default.empty,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: loadError })]
							}),
							loadError === null && response === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.empty,
								children: t("tree.loading")
							}),
							connectError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.errorText,
								role: "alert",
								children: t("conn.failed", { message: connectError })
							}),
							response !== null && loadError === null && openFile === null && mode === "local" && (localRoot === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.empty,
								children: t("tree.empty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileTree, {
								root: localRoot,
								list: (path, signal) => list(sid, path, signal),
								mode: "local",
								onOpenFile: setOpenFile,
								onCreate: (dirPath, kind) => {
									setCreateTarget({
										dirPath,
										kind
									});
									setNewName("");
									setCreateError(null);
								},
								onDelete: setDeleteTarget,
								onOpenLocal: handleOpenLocal,
								t
							}, `local-${localRoot}`)),
							response !== null && loadError === null && openFile === null && mode === "ssh" && (connected && sshRoot !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileTree, {
								root: sshRoot,
								list: (path, signal) => list(sid, path, signal),
								mode: "ssh",
								onOpenFile: setOpenFile,
								onCreate: (dirPath, kind) => {
									setCreateTarget({
										dirPath,
										kind
									});
									setNewName("");
									setCreateError(null);
								},
								onDelete: setDeleteTarget,
								onOpenLocal: handleOpenLocal,
								t
							}, `ssh-${sshRoot}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.empty,
								children: response.state.servers.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("conn.empty") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("conn.notConnected") })
							})),
							openFile !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileEditor, {
								path: openFile,
								read: (path, signal) => read(sid, path, signal),
								write: (path, content) => write(sid, path, content),
								onClose: () => {
									setOpenFile(null);
								},
								t
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServerManager, {
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
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: createTarget !== null,
						onClose: () => {
							setCreateTarget(null);
						},
						closeLabel: t("form.cancel"),
						title: createTarget?.kind === "file" ? t("tree.newFile") : t("tree.newDir"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: () => {
								setCreateTarget(null);
							},
							children: t("form.cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							disabled: createBusy || newName.trim() === "",
							onClick: () => {
								handleCreate();
							},
							children: t("tree.create")
						})] }),
						children: [
							createTarget !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.createDir,
								children: createTarget.dirPath
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: newName,
								placeholder: t("tree.newNamePlaceholder"),
								onChange: (event) => {
									setNewName(event.target.value);
								},
								onKeyDown: (event) => {
									if (event.key === "Enter" && newName.trim() !== "") handleCreate();
								}
							}),
							createError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SshFilesPanel_module_css_default.errorText,
								role: "alert",
								children: createError
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteTarget !== null,
						onClose: () => {
							setDeleteTarget(null);
						},
						closeLabel: t("form.cancel"),
						title: t("tree.delete"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: () => {
								setDeleteTarget(null);
							},
							children: t("form.cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							disabled: deleteBusy,
							onClick: () => {
								handleDelete();
							},
							children: t("tree.delete")
						})] }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SshFilesPanel_module_css_default.deleteText,
							children: deleteTarget !== null && t("tree.deleteConfirm", { name: deleteTarget.name })
						}), deleteError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SshFilesPanel_module_css_default.errorText,
							role: "alert",
							children: deleteError
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* `ssh-files` namespace dictionaries: the details-panel mode bar, server
		* manager, file tree, and editor copy. Runtime failure messages (host/wire
		* strings) pass through untranslated by policy.
		*/
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"panel.title": "文件",
			"panel.close": "关闭面板",
			"mode.local": "本地",
			"mode.ssh": "SSH",
			"mode.tip": "选择工作方式（默认打开最近一次使用的方式）",
			"conn.select": "选择服务器",
			"conn.connect": "连接",
			"conn.connecting": "连接中…",
			"conn.disconnect": "断开",
			"conn.manage": "管理服务器",
			"conn.connectedTo": "已连接 {name}",
			"conn.connected": "已连接",
			"conn.notConnected": "未连接",
			"conn.newSessionOn": "以此服务器开新对话",
			"conn.empty": "还没有保存的服务器，点击右上角「管理服务器」添加。",
			"conn.failed": "连接失败：{message}",
			"conn.serverLabel": "服务器「{name}」",
			"manage.title": "管理服务器",
			"manage.add": "添加服务器",
			"manage.edit": "编辑",
			"manage.delete": "删除",
			"manage.empty": "暂无服务器记录",
			"manage.deleteConfirm": "删除服务器「{name}」？",
			"form.titleAdd": "添加服务器",
			"form.titleEdit": "编辑服务器",
			"form.name": "名称",
			"form.namePlaceholder": "例如：生产环境",
			"form.host": "主机地址",
			"form.hostPlaceholder": "例如：192.168.1.10 或 server.example.com",
			"form.port": "端口",
			"form.username": "用户名",
			"form.auth": "认证方式",
			"form.authPassword": "密码",
			"form.authKey": "私钥文件",
			"form.authAgent": "SSH Agent / 默认密钥",
			"form.password": "密码",
			"form.passwordPlaceholder": "登录密码",
			"form.keyPath": "私钥路径",
			"form.keyPathPlaceholder": "例如：C:\\Users\\me\\.ssh\\id_rsa 或 ~/.ssh/id_rsa",
			"form.root": "初始目录",
			"form.rootPlaceholder": "留空则使用登录目录（家目录）",
			"form.save": "保存",
			"form.cancel": "取消",
			"form.invalidPort": "端口必须是 1-65535 的整数",
			"tree.loading": "正在加载…",
			"tree.empty": "（空目录）",
			"tree.error": "无法读取目录",
			"tree.retry": "重试",
			"tree.showHidden": "显示隐藏文件",
			"tree.hideHidden": "隐藏隐藏文件",
			"tree.parent": "上级目录",
			"tree.refresh": "刷新",
			"tree.newFile": "新建文件",
			"tree.newDir": "新建目录",
			"tree.newName": "名称",
			"tree.newNamePlaceholder": "输入名称",
			"tree.create": "创建",
			"tree.delete": "删除",
			"tree.deleteConfirm": "删除「{name}」？此操作不可撤销。",
			"tree.openCode": "在 VS Code 中打开",
			"tree.openMarktext": "用 MarkText 打开",
			"tree.openDefault": "用默认应用打开",
			"tree.openFailed": "打开失败：{message}",
			"editor.title": "文件",
			"editor.close": "关闭编辑器",
			"editor.save": "保存",
			"editor.saving": "保存中…",
			"editor.saved": "已保存",
			"editor.loading": "正在读取…",
			"editor.readFailed": "读取失败：{message}",
			"editor.saveFailed": "保存失败：{message}",
			"editor.unsaved": "有未保存的修改，关闭将丢失。确定关闭？",
			"editor.dirty": "未保存",
			"editor.bytes": "{size} 字节"
		};
		/** English dictionary (key-complete mirror of zh). */
		const en = {
			"panel.title": "Files",
			"panel.close": "Close panel",
			"mode.local": "Local",
			"mode.ssh": "SSH",
			"mode.tip": "Choose the working mode (the last used one opens by default)",
			"conn.select": "Select server",
			"conn.connect": "Connect",
			"conn.connecting": "Connecting…",
			"conn.disconnect": "Disconnect",
			"conn.manage": "Manage servers",
			"conn.connectedTo": "Connected to {name}",
			"conn.connected": "Connected",
			"conn.notConnected": "Not connected",
			"conn.newSessionOn": "New conversation on this server",
			"conn.empty": "No servers saved yet — click \"Manage servers\" in the top-right to add one.",
			"conn.failed": "Connection failed: {message}",
			"conn.serverLabel": "Server \"{name}\"",
			"manage.title": "Manage servers",
			"manage.add": "Add server",
			"manage.edit": "Edit",
			"manage.delete": "Delete",
			"manage.empty": "No server records yet",
			"manage.deleteConfirm": "Delete server \"{name}\"?",
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
			"tree.loading": "Loading…",
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
			"tree.deleteConfirm": "Delete \"{name}\"? This cannot be undone.",
			"tree.openCode": "Open in VS Code",
			"tree.openMarktext": "Open with MarkText",
			"tree.openDefault": "Open with default app",
			"tree.openFailed": "Open failed: {message}",
			"editor.title": "File",
			"editor.close": "Close editor",
			"editor.save": "Save",
			"editor.saving": "Saving…",
			"editor.saved": "Saved",
			"editor.loading": "Reading…",
			"editor.readFailed": "Read failed: {message}",
			"editor.saveFailed": "Save failed: {message}",
			"editor.unsaved": "You have unsaved changes; closing will discard them. Close anyway?",
			"editor.dirty": "Unsaved",
			"editor.bytes": "{size} bytes"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "ssh-files";
		/** The RPC channel this plugin's host half mounts. */
		const RPC_CHANNEL = "/ssh-files";
		/** Validate one wire server record. */
		function parseServer(value) {
			if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed server record");
			const record = value;
			if (typeof record.id !== "string" || typeof record.name !== "string" || typeof record.host !== "string" || typeof record.port !== "number" || typeof record.username !== "string" || record.auth !== "password" && record.auth !== "key" && record.auth !== "agent" || typeof record.root !== "string") throw new Error("ssh-files: malformed server record");
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
		/** Validate one wire state response (wire boundary: never trust the response shape). */
		function parseStateResponse(value) {
			if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed state response");
			const response = value;
			const state = response.state;
			if (typeof state !== "object" || state === null) throw new Error("ssh-files: malformed state");
			const record = state;
			if (record.mode !== "local" && record.mode !== "ssh") throw new Error("ssh-files: malformed mode");
			if (typeof record.serverId !== "string" && record.serverId !== null) throw new Error("ssh-files: malformed server id");
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
		/** Validate one wire listing row. */
		function parseEntry(value) {
			if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed listing row");
			const { name, path, kind, hidden } = value;
			if (typeof name !== "string" || typeof path !== "string" || typeof hidden !== "boolean") throw new Error("ssh-files: malformed listing row");
			if (kind !== "dir" && kind !== "file") throw new Error("ssh-files: malformed listing row");
			return {
				name,
				path,
				kind,
				hidden
			};
		}
		/** Validate one wire listing result. */
		function parseListing(value) {
			if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed listing response");
			const listing = value;
			if (typeof listing.path !== "string" || !Array.isArray(listing.entries)) throw new Error("ssh-files: malformed listing response");
			return {
				path: listing.path,
				entries: listing.entries.map(parseEntry)
			};
		}
		/** Validate one wire read result. */
		function parseRead(value) {
			if (typeof value !== "object" || value === null) throw new Error("ssh-files: malformed read response");
			const content = value.content;
			if (typeof content !== "string") throw new Error("ssh-files: malformed read response");
			return content;
		}
		/** Call one `/ssh-files` endpoint for one session, throwing on failure. */
		async function rpcCall(connection, sessionId, endpoint, payload, signal) {
			const response = await connection.rpc.call(RPC_CHANNEL, endpoint, {
				...payload,
				sessionId
			}, signal);
			if (!response.ok) throw new Error(response.error.message);
			return response.value;
		}
		/**
		* Required services (cordis fiber inject): the slot registry, the layout
		* panel face, the workspaces runtime (default-app open), the connection
		* transport, and the locale service.
		*/
		const inject = [
			"slots",
			"layout",
			"workspaces",
			"connection",
			"locale"
		];
		/**
		* Register the mode-switching file panel once the layout's `details`
		* declaration is on the ledger. The inject face closes over `ctx`, so the
		* RPC calls stay live for the registration's whole lifetime.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const connection = ctx.get("connection");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ssh-files: dictionaries");
			ctx.slots.inject("details", () => ctx.slots.register({
				name: "details",
				priority: -2,
				locale: NS,
				inject: () => ({
					openDetails: () => {
						ctx.layout.openDetails();
					},
					closeDetails: () => {
						ctx.layout.closeDetails();
					},
					getState: (sessionId, signal) => rpcCall(connection, sessionId, "get-state", {}, signal).then(parseStateResponse),
					setMode: (sessionId, mode) => rpcCall(connection, sessionId, "set-mode", { mode }).then(parseStateResponse),
					addServer: (sessionId, input) => rpcCall(connection, sessionId, "add-server", input).then(parseStateResponse),
					updateServer: (sessionId, id, input) => rpcCall(connection, sessionId, "update-server", {
						id,
						server: input
					}).then(parseStateResponse),
					removeServer: (sessionId, id) => rpcCall(connection, sessionId, "remove-server", { id }).then(parseStateResponse),
					connect: (sessionId, id, signal) => rpcCall(connection, sessionId, "connect", { id }, signal).then(parseStateResponse),
					disconnect: (sessionId) => rpcCall(connection, sessionId, "disconnect", {}).then(parseStateResponse),
					list: (sessionId, path, signal) => rpcCall(connection, sessionId, "list", { path }, signal).then(parseListing),
					read: (sessionId, path, signal) => rpcCall(connection, sessionId, "read", { path }, signal).then(parseRead),
					write: (sessionId, path, content) => rpcCall(connection, sessionId, "write", {
						path,
						content
					}).then(() => void 0),
					mkdir: (sessionId, path) => rpcCall(connection, sessionId, "mkdir", { path }).then(() => void 0),
					unlink: (sessionId, path) => rpcCall(connection, sessionId, "unlink", { path }).then(() => void 0),
					openNewSessionOn: async (serverId) => {
						await rpcCall(connection, "", "connect", { id: serverId });
						ctx.workspaces.startSession();
					},
					openLocalDefault: (path) => ctx.workspaces.openPath(path),
					openLocalCode: (path) => rpcCall(connection, "", "open-local", {
						path,
						command: "code"
					}).then(() => void 0),
					openLocalMarktext: (path) => rpcCall(connection, "", "open-local", {
						path,
						command: "marktext"
					}).then(() => void 0)
				})
			}, SshFilesPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map