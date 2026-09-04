window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-workspace-files",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:D:\DeepSeek Harness\packages\extensions\dsh-workspace-files\src\client\WorkspaceFilesPanel.module.css.mjs
		const css = ".K29l_G_root{border-left:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);flex-direction:column;min-width:0;height:100%;display:flex}.K29l_G_header{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:8px;padding:10px 12px 0;display:flex}.K29l_G_tabs{gap:2px;min-width:0;display:flex}.K29l_G_tab{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-bottom:2px solid #0000;border-radius:6px 6px 0 0;flex:none;padding:4px 12px 10px;font-size:13px;line-height:20px}.K29l_G_tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.K29l_G_tabActive,.K29l_G_tabActive:hover{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);background:0 0;font-weight:500}.K29l_G_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;place-items:center;display:grid}.K29l_G_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.K29l_G_body{flex:1;min-height:0;overflow-y:auto}.K29l_G_empty{color:var(--dsw-alias-label-tertiary);padding:12px 16px;font-size:13px;line-height:20px}.K29l_G_tree{flex-direction:column;height:100%;min-height:0;display:flex}.K29l_G_treeToolbar{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:4px;padding:8px 10px;display:flex}.K29l_G_treeRoot{min-width:0;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;font-weight:500;line-height:18px;overflow:hidden}.K29l_G_iconButton{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;place-items:center;display:grid}.K29l_G_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.K29l_G_treeBody{flex:1;min-height:0;padding:6px 0 12px;overflow-y:auto}.K29l_G_row{height:26px;color:var(--dsw-alias-label-primary);user-select:none;align-items:center;gap:6px;padding-right:8px;font-size:13px;line-height:20px;display:flex}.K29l_G_row[data-dir]{cursor:pointer}.K29l_G_row[data-dir]:hover{background:var(--dsw-alias-interactive-bg-hover)}.K29l_G_row[data-file]{cursor:pointer}.K29l_G_row[data-file]:hover{background:var(--dsw-alias-interactive-bg-hover)}.K29l_G_chevron{color:var(--dsw-alias-label-tertiary);flex:none}.K29l_G_folderIcon{color:var(--dsw-alias-state-warn-primary);flex:none}.K29l_G_fileGlyph{flex:none}.K29l_G_rowSpacer{flex:none;width:14px}.K29l_G_rowName{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.K29l_G_rowMenu{width:22px;height:22px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:5px;flex:none;place-items:center;padding:0;display:none}.K29l_G_row:hover .K29l_G_rowMenu,.K29l_G_row:focus-within .K29l_G_rowMenu{display:grid}.K29l_G_rowMenu:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.K29l_G_openMenu{flex-direction:column;gap:2px;padding-bottom:6px;display:flex}.K29l_G_menuItem{text-align:left;width:fit-content;max-width:100%;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:5px;padding:3px 8px;font-size:12px;line-height:18px;display:block}.K29l_G_menuItem:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.K29l_G_errorText{color:var(--dsw-alias-state-error-primary)}.K29l_G_rowError{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;padding-bottom:6px;font-size:12px;line-height:18px}.K29l_G_inlineButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:5px;flex:none;padding:2px 8px;font-size:12px;line-height:18px}.K29l_G_inlineButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.K29l_G_actionError{border-top:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;display:flex}.K29l_G_actionErrorText{min-width:0;color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;flex:1;font-size:12px;line-height:18px}.K29l_G_toolBody{flex-direction:column;height:100%;min-height:0;display:flex}.K29l_G_toolList{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;max-height:40%;margin:0;padding:6px 8px;list-style:none;overflow-y:auto}.K29l_G_toolList li{margin:0;padding:0}.K29l_G_toolItem{text-align:left;width:100%;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:8px;padding:4px 8px;font-size:13px;line-height:20px;display:flex}.K29l_G_toolItem:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.K29l_G_toolItemActive,.K29l_G_toolItemActive:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.K29l_G_toolStatus{background:var(--dsw-alias-state-success-primary);border-radius:999px;flex:none;width:8px;height:8px}.K29l_G_toolStatus[data-running]{background:var(--dsw-alias-state-warn-primary)}.K29l_G_toolName{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-family:var(--dsh-font-mono,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);flex:1;font-size:12px;overflow:hidden}.K29l_G_toolDetail{flex:1;min-height:0;padding:12px 16px;overflow-y:auto}.K29l_G_toolDetailTitle{color:var(--dsw-alias-label-primary);margin-bottom:10px;font-size:13px;font-weight:500;line-height:20px}.K29l_G_section{margin-bottom:16px}.K29l_G_sectionLabel{color:var(--dsw-alias-label-secondary);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.K29l_G_code{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-family:var(--dsh-font-mono,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;border-radius:8px;margin:0;padding:10px 12px;font-size:12px;line-height:20px;overflow:auto}.K29l_G_code[data-error]{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "@deepseek-ai/dsh-workspace-files/WorkspaceFilesPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-workspace-files";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WorkspaceFilesPanel_module_css_default = {
			"actionError": "K29l_G_actionError",
			"actionErrorText": "K29l_G_actionErrorText",
			"body": "K29l_G_body",
			"chevron": "K29l_G_chevron",
			"close": "K29l_G_close",
			"code": "K29l_G_code",
			"empty": "K29l_G_empty",
			"errorText": "K29l_G_errorText",
			"fileGlyph": "K29l_G_fileGlyph",
			"folderIcon": "K29l_G_folderIcon",
			"header": "K29l_G_header",
			"iconButton": "K29l_G_iconButton",
			"inlineButton": "K29l_G_inlineButton",
			"menuItem": "K29l_G_menuItem",
			"openMenu": "K29l_G_openMenu",
			"root": "K29l_G_root",
			"row": "K29l_G_row",
			"rowError": "K29l_G_rowError",
			"rowMenu": "K29l_G_rowMenu",
			"rowName": "K29l_G_rowName",
			"rowSpacer": "K29l_G_rowSpacer",
			"section": "K29l_G_section",
			"sectionLabel": "K29l_G_sectionLabel",
			"tab": "K29l_G_tab",
			"tabActive": "K29l_G_tabActive",
			"tabs": "K29l_G_tabs",
			"toolBody": "K29l_G_toolBody",
			"toolDetail": "K29l_G_toolDetail",
			"toolDetailTitle": "K29l_G_toolDetailTitle",
			"toolItem": "K29l_G_toolItem",
			"toolItemActive": "K29l_G_toolItemActive",
			"toolList": "K29l_G_toolList",
			"toolName": "K29l_G_toolName",
			"toolStatus": "K29l_G_toolStatus",
			"tree": "K29l_G_tree",
			"treeBody": "K29l_G_treeBody",
			"treeRoot": "K29l_G_treeRoot",
			"treeToolbar": "K29l_G_treeToolbar"
		};
		//#endregion
		//#region src/client/files-tree.tsx
		/**
		* FileTree: the files tab's lazy, expandable directory tree. Rows load one
		* directory level at a time through the injected `list` (abort-guarded),
		* directories expand on click, files open through the extension-routed
		* primary opener (Markdown → MarkText, code → VS Code, everything else →
		* the default app) or through the per-row "open with…" menu. Hidden
		* dot-entries are filtered client-side behind a toggle.
		*/
		const MARKDOWN_EXTENSIONS = new Set([
			".md",
			".markdown",
			".mdown",
			".mkd"
		]);
		const CODE_EXTENSIONS = new Set([
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
		/** Extension-less build/ignore/editor files whose content is code, not prose. */
		const CODE_BASENAMES = new Set([
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
		/** Lower-cased extension of a base name (empty when it has none). */
		function extensionOf(name) {
			const dot = name.lastIndexOf(".");
			return dot === -1 ? "" : name.slice(dot).toLowerCase();
		}
		/** File presentation category: drives the primary opener and the row glyph. */
		function fileKindOf(name) {
			const ext = extensionOf(name);
			if (MARKDOWN_EXTENSIONS.has(ext)) return "markdown";
			if (CODE_EXTENSIONS.has(ext)) return "code";
			const lower = name.toLowerCase();
			if (lower.startsWith(".env") || CODE_BASENAMES.has(lower)) return "code";
			return "other";
		}
		/** Small colored document glyph keyed by the file's presentation category. */
		function FileGlyph({ kind }) {
			const color = kind === "markdown" ? "var(--dsw-alias-state-info-primary, #3b82f6)" : kind === "code" ? "var(--dsw-alias-state-success-primary, #22c55e)" : "var(--dsw-alias-label-tertiary, #94a3b8)";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				width: "15",
				height: "15",
				"aria-hidden": true,
				className: WorkspaceFilesPanel_module_css_default.fileGlyph,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
						fill: color,
						opacity: "0.18"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z",
						fill: "none",
						stroke: color,
						strokeWidth: "1.1"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M9 1.5v3.5h3.5",
						fill: "none",
						stroke: color,
						strokeWidth: "1.1"
					})
				]
			});
		}
		/**
		* The file tree. Owns all tree state (loaded levels, expansion, hidden
		* toggle, the open menu, and in-flight open feedback); renders recursively.
		*/
		function FileTree({ root, list, openPath, openInCode, openInMarktext, t }) {
			const [levels, setLevels] = (0, react.useState)({});
			const [expanded, setExpanded] = (0, react.useState)({ [root]: true });
			const [loading, setLoading] = (0, react.useState)({});
			const [errors, setErrors] = (0, react.useState)({});
			const [showHidden, setShowHidden] = (0, react.useState)(false);
			const [menuPath, setMenuPath] = (0, react.useState)(null);
			const [busyPath, setBusyPath] = (0, react.useState)(null);
			const [failure, setFailure] = (0, react.useState)(null);
			const aborters = (0, react.useRef)(/* @__PURE__ */ new Map());
			const ensureLoaded = (path) => {
				setLoading((prev) => prev[path] === true ? prev : {
					...prev,
					[path]: true
				});
				setErrors((prev) => {
					if (prev[path] === void 0) return prev;
					const { [path]: _dropped, ...rest } = prev;
					return rest;
				});
				const controller = new AbortController();
				aborters.current.set(path, controller);
				list(path, controller.signal).then((level) => {
					if (controller.signal.aborted) return;
					aborters.current.delete(path);
					setLevels((prev) => ({
						...prev,
						[path]: level
					}));
					setLoading((prev) => {
						const { [path]: _dropped, ...rest } = prev;
						return rest;
					});
				}, (reason) => {
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
				});
			};
			(0, react.useEffect)(() => {
				ensureLoaded(root);
			}, [root]);
			const toggle = (path) => {
				setExpanded((prev) => ({
					...prev,
					[path]: prev[path] !== true
				}));
				if (expanded[path] !== true) ensureLoaded(path);
			};
			const refresh = () => {
				for (const controller of aborters.current.values()) controller.abort();
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
				opener(entry.path).then(() => {
					setBusyPath(null);
				}, (reason) => {
					setBusyPath(null);
					setFailure({
						path: entry.path,
						message: reason instanceof Error ? reason.message : String(reason)
					});
				});
			};
			const primaryOpener = (entry) => {
				if (entry.kind === "dir") return null;
				const kind = fileKindOf(entry.name);
				if (kind === "markdown") return openInMarktext;
				if (kind === "code") return openInCode;
				return openPath;
			};
			const primaryLabel = (entry) => {
				const kind = fileKindOf(entry.name);
				if (kind === "markdown") return t("file.openMarktext");
				if (kind === "code") return t("file.openCode");
				return t("file.openDefault");
			};
			const renderLevel = (path, depth) => {
				const level = levels[path];
				const isLoading = loading[path] === true;
				const error = errors[path];
				const pad = { paddingLeft: depth * 14 + 10 };
				if (error !== void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: WorkspaceFilesPanel_module_css_default.row,
					style: pad,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: WorkspaceFilesPanel_module_css_default.errorText,
						children: t("tree.error")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceFilesPanel_module_css_default.inlineButton,
						onClick: () => {
							ensureLoaded(path);
						},
						children: t("tree.retry")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceFilesPanel_module_css_default.rowError,
					style: pad,
					children: error
				})] }, path);
				if (level === void 0) return isLoading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceFilesPanel_module_css_default.row,
					style: pad,
					children: t("tree.loading")
				}, path) : null;
				const visible = level.entries.filter((entry) => !entry.hidden || showHidden);
				if (visible.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceFilesPanel_module_css_default.row,
					style: pad,
					children: t("tree.empty")
				}, path);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Fragment, { children: visible.map((entry) => {
					if (entry.kind === "dir") {
						const open = expanded[entry.path] === true;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: WorkspaceFilesPanel_module_css_default.row,
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
								open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: WorkspaceFilesPanel_module_css_default.chevron }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: WorkspaceFilesPanel_module_css_default.chevron }),
								open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, { className: WorkspaceFilesPanel_module_css_default.folderIcon }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { className: WorkspaceFilesPanel_module_css_default.folderIcon }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: WorkspaceFilesPanel_module_css_default.rowName,
									children: entry.name
								})
							]
						}), open && renderLevel(entry.path, depth + 1)] }, entry.path);
					}
					const primary = primaryOpener(entry);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.row,
						style: pad,
						"data-file": true,
						title: `${entry.path}\n${primaryLabel(entry)}`,
						onClick: () => {
							if (primary !== null) runOpen(entry, primary);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: WorkspaceFilesPanel_module_css_default.rowSpacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileGlyph, { kind: fileKindOf(entry.name) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: WorkspaceFilesPanel_module_css_default.rowName,
								children: entry.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.rowMenu,
								"aria-label": t("file.menuAria", { name: entry.name }),
								title: t("file.menuAria", { name: entry.name }),
								onClick: (e) => {
									e.stopPropagation();
									setMenuPath(menuPath === entry.path ? null : entry.path);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
							})
						]
					}), menuPath === entry.path && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.openMenu,
						style: { paddingLeft: depth * 14 + 34 },
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.menuItem,
								onClick: () => {
									setMenuPath(null);
									runOpen(entry, openInCode);
								},
								children: t("file.openCode")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.menuItem,
								onClick: () => {
									setMenuPath(null);
									runOpen(entry, openInMarktext);
								},
								children: t("file.openMarktext")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.menuItem,
								onClick: () => {
									setMenuPath(null);
									runOpen(entry, openPath);
								},
								children: t("file.openDefault")
							})
						]
					})] }, entry.path);
				}) }, path);
			};
			const rootName = (0, react.useMemo)(() => {
				const trimmed = root.endsWith("/") || root.endsWith("\\") ? root.slice(0, -1) : root;
				const sep = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
				return sep === -1 ? trimmed : trimmed.slice(sep + 1);
			}, [root]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceFilesPanel_module_css_default.tree,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.treeToolbar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: WorkspaceFilesPanel_module_css_default.treeRoot,
								title: root,
								children: rootName || root
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.iconButton,
								"aria-label": t("refresh"),
								title: t("refresh"),
								onClick: () => {
									refresh();
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline14, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceFilesPanel_module_css_default.iconButton,
								"aria-pressed": showHidden,
								title: showHidden ? t("tree.hideHidden") : t("tree.showHidden"),
								onClick: () => {
									setShowHidden((prev) => !prev);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.treeBody,
						children: [renderLevel(root, 0), busyPath !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceFilesPanel_module_css_default.row,
							children: t("tree.loading")
						})]
					}),
					failure !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.actionError,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: WorkspaceFilesPanel_module_css_default.actionErrorText,
							children: t("action.failed", { message: failure.message })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorkspaceFilesPanel_module_css_default.inlineButton,
							onClick: () => {
								const path = failure.path;
								setFailure(null);
								runOpen({
									name: path,
									path,
									kind: "file",
									hidden: false
								}, openPath);
							},
							children: t("action.fallback")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/tool-details.tsx
		/**
		* ToolDetails: the "tools" tab inspector. Reads the conversation snapshot
		* directly — the shared chat-store selection belongs to ui-conversation,
		* whose DetailsPanel this plugin shadows — and lists every tool call
		* materialized in the current window. Selecting one shows its input and
		* output; output renders as plain text/JSON (the tool-specific
		* `conversation.details.tool` renderers stay bound to the shadowed
		* DetailsPanel's declaration, so they are not re-rendered here).
		*/
		/** Collect every root tool call materialized in the current window. */
		function collectToolCalls(snapshot) {
			const out = [];
			for (const node of snapshot.chat.nodes.values()) if (node.kind === "tool-call") {
				const root = node.data.root;
				out.push(root);
			}
			return out;
		}
		/** Display name of a call: the settled call's name when present, else its id. */
		function displayName(call) {
			return "kind" in call ? call.call?.name ?? call.callId : call.name;
		}
		/** Pretty-print a raw JSON args string, falling back to verbatim text. */
		function pretty(raw) {
			try {
				return JSON.stringify(JSON.parse(raw), null, 2);
			} catch {
				return raw;
			}
		}
		/** Flatten a settled result's content into display text. */
		function rawResultText(block) {
			const parts = block.content.map((item) => item.type === "text" ? item.text : JSON.stringify(item, null, 2));
			if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
			return parts.join("\n");
		}
		/** One selected call's input/output body. */
		function ToolCallDetail({ block, t }) {
			const settled = "kind" in block;
			const name = displayName(block);
			const argsRaw = settled ? block.call?.argsRaw ?? null : block.argsRaw;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceFilesPanel_module_css_default.toolDetail,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceFilesPanel_module_css_default.toolDetailTitle,
						children: name
					}),
					argsRaw !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: WorkspaceFilesPanel_module_css_default.section,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceFilesPanel_module_css_default.sectionLabel,
							children: t("tool.args")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.CodeBlock, {
							code: pretty(argsRaw),
							lang: "json",
							copyLabel: t("copy"),
							copiedLabel: t("copied")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: WorkspaceFilesPanel_module_css_default.section,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceFilesPanel_module_css_default.sectionLabel,
							children: t("tool.output")
						}), settled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: WorkspaceFilesPanel_module_css_default.code,
							"data-error": block.isError || void 0,
							children: rawResultText(block)
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceFilesPanel_module_css_default.empty,
							children: t("tool.running")
						})]
					})
				]
			});
		}
		/** The tools tab: a call list on top, the selected call's body below. */
		function ToolDetails({ useSession, t }) {
			const snapshot = useSession((s) => s);
			const calls = (0, react.useMemo)(() => collectToolCalls(snapshot), [snapshot]);
			const [selectedId, setSelectedId] = (0, react.useState)(null);
			const selected = calls.find((call) => call.callId === selectedId) ?? null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceFilesPanel_module_css_default.toolBody,
				children: [
					calls.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceFilesPanel_module_css_default.empty,
						children: t("tool.empty")
					}),
					calls.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: WorkspaceFilesPanel_module_css_default.toolList,
						"aria-label": t("tool.listAria"),
						children: calls.map((call) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: selectedId === call.callId ? `${WorkspaceFilesPanel_module_css_default.toolItem} ${WorkspaceFilesPanel_module_css_default.toolItemActive}` : WorkspaceFilesPanel_module_css_default.toolItem,
							"aria-label": t("tool.callAria", { name: displayName(call) }),
							onClick: () => {
								setSelectedId(call.callId);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: WorkspaceFilesPanel_module_css_default.toolStatus,
								"data-running": !("kind" in call) || void 0
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: WorkspaceFilesPanel_module_css_default.toolName,
								children: displayName(call)
							})]
						}) }, call.callId))
					}),
					selected !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolCallDetail, {
						block: selected,
						t
					})
				]
			});
		}
		//#endregion
		//#region src/client/panel.tsx
		/**
		* WorkspaceFilesPanel: the details-column occupant this plugin registers.
		* A tabbed panel — "Files" (the workspace file tree, rooted at the current
		* session's working directory) and "Tools" (the tool-call inspector). The
		* panel auto-opens the column is not its job: ui-conversation's inspect
		* gesture opens it, and this plugin's own registration wins the column the
		* moment it is open.
		*/
		/** The tabbed details panel. */
		function WorkspaceFilesPanel(props) {
			const { useSessions, useSession, sessionId, t, openDetails, closeDetails, list, openPath, openInCode, openInMarktext } = props;
			const cwd = useSessions((store) => store.byId[sessionId]?.cwd);
			const [tab, setTab] = (0, react.useState)("files");
			(0, react.useEffect)(() => {
				openDetails();
			}, [openDetails]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceFilesPanel_module_css_default.root,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: WorkspaceFilesPanel_module_css_default.header,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesPanel_module_css_default.tabs,
						role: "tablist",
						"aria-label": t("panel.title"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "files",
							className: tab === "files" ? `${WorkspaceFilesPanel_module_css_default.tab} ${WorkspaceFilesPanel_module_css_default.tabActive}` : WorkspaceFilesPanel_module_css_default.tab,
							onClick: () => {
								setTab("files");
							},
							children: t("tab.files")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "tool",
							className: tab === "tool" ? `${WorkspaceFilesPanel_module_css_default.tab} ${WorkspaceFilesPanel_module_css_default.tabActive}` : WorkspaceFilesPanel_module_css_default.tab,
							onClick: () => {
								setTab("tool");
							},
							children: t("tab.tool")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceFilesPanel_module_css_default.close,
						"aria-label": t("panel.close"),
						title: t("panel.close"),
						onClick: () => {
							closeDetails();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceFilesPanel_module_css_default.body,
					children: tab === "files" ? cwd === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceFilesPanel_module_css_default.empty,
						children: t("tree.empty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FileTree, {
						root: cwd,
						list,
						openPath,
						openInCode,
						openInMarktext,
						t
					}, cwd) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolDetails, {
						useSession,
						t
					})
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* `workspace-files` namespace dictionaries: the details-panel tabs, tree
		* rows, and opener actions. Runtime failure messages (host/wire strings)
		* pass through untranslated by policy.
		*/
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"panel.title": "工作区文件",
			"panel.close": "关闭面板",
			"tab.files": "文件",
			"tab.tool": "工具",
			"root.open": "在默认应用中打开",
			"tree.loading": "正在加载…",
			"tree.empty": "（空目录）",
			"tree.error": "无法读取目录",
			"tree.retry": "重试",
			"tree.showHidden": "显示隐藏文件",
			"tree.hideHidden": "隐藏隐藏文件",
			"refresh": "刷新",
			"file.menuAria": "文件“{name}”的打开方式",
			"file.openCode": "在 VS Code 中打开",
			"file.openMarktext": "用 MarkText 打开",
			"file.openDefault": "用默认应用打开",
			"action.failed": "打开失败：{message}",
			"action.fallback": "改用默认应用打开",
			"tool.empty": "暂无工具调用",
			"tool.listAria": "工具调用列表",
			"tool.callAria": "查看工具调用“{name}”",
			"tool.args": "输入",
			"tool.output": "输出",
			"tool.running": "执行中…",
			"tool.error": "出错",
			"tool.notInWindow": "该调用不在当前窗口内"
		};
		/** English dictionary (key-complete mirror of zh). */
		const en = {
			"panel.title": "Workspace Files",
			"panel.close": "Close panel",
			"tab.files": "Files",
			"tab.tool": "Tools",
			"root.open": "Open in default app",
			"tree.loading": "Loading…",
			"tree.empty": "(empty directory)",
			"tree.error": "Cannot read directory",
			"tree.retry": "Retry",
			"tree.showHidden": "Show hidden files",
			"tree.hideHidden": "Hide hidden files",
			"refresh": "Refresh",
			"file.menuAria": "Open actions for “{name}”",
			"file.openCode": "Open in VS Code",
			"file.openMarktext": "Open with MarkText",
			"file.openDefault": "Open with default app",
			"action.failed": "Open failed: {message}",
			"action.fallback": "Open with default app instead",
			"tool.empty": "No tool calls yet",
			"tool.listAria": "Tool call list",
			"tool.callAria": "Inspect tool call “{name}”",
			"tool.args": "Input",
			"tool.output": "Output",
			"tool.running": "Running…",
			"tool.error": "Error",
			"tool.notInWindow": "This call is not in the current window"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "workspace-files";
		/** The RPC channel this plugin's host half mounts. */
		const RPC_CHANNEL = "/workspace-files";
		/** Validate one wire `list` result (wire boundary: never trust the response shape). */
		function parseListing(value) {
			if (typeof value !== "object" || value === null) throw new Error("workspace-files: malformed listing response");
			const listing = value;
			if (typeof listing.path !== "string" || !Array.isArray(listing.entries)) throw new Error("workspace-files: malformed listing response");
			const entries = listing.entries;
			const rows = [];
			for (const entry of entries) {
				if (typeof entry !== "object" || entry === null) throw new Error("workspace-files: malformed listing row");
				const row = entry;
				if (typeof row.name !== "string" || typeof row.path !== "string" || row.kind !== "dir" && row.kind !== "file" || typeof row.hidden !== "boolean") throw new Error("workspace-files: malformed listing row");
				rows.push({
					name: row.name,
					path: row.path,
					kind: row.kind,
					hidden: row.hidden
				});
			}
			return {
				path: listing.path,
				entries: rows
			};
		}
		/** Call one `/workspace-files` endpoint, throwing the host's message on failure. */
		async function rpcCall(connection, endpoint, payload, signal) {
			const response = await connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal);
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
		* Register the tabbed details panel once the layout's `details` declaration
		* is on the ledger. The inject face closes over `ctx`, so the openers stay
		* live for the registration's whole lifetime.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const connection = ctx.get("connection");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "workspace-files: dictionaries");
			ctx.slots.inject("details", () => ctx.slots.register({
				name: "details",
				priority: -1,
				locale: NS,
				inject: () => ({
					openDetails: () => {
						ctx.layout.openDetails();
					},
					closeDetails: () => {
						ctx.layout.closeDetails();
					},
					list: (path, signal) => rpcCall(connection, "list", { path }, signal).then(parseListing),
					openPath: (path) => ctx.workspaces.openPath(path),
					openInCode: (path) => rpcCall(connection, "open-in-code", { path }).then(() => void 0),
					openInMarktext: (path) => rpcCall(connection, "open-in-marktext", { path }).then(() => void 0)
				})
			}, WorkspaceFilesPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map