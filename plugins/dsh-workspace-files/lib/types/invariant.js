/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-workspace-files`.
 * @module @deepseek-ai/dsh-workspace-files/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-workspace-files';
/** Cordis companion plugin name. */
export const name = 'workspace-files-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the host half registers one RPC channel whose
 * disposer is the registration effect's own return value (the effect
 * contract owns the teardown), and the browser half's slot registration is
 * equally self-disposing. The host emits no cordis events and holds no
 * cross-plugin mutable state worth asserting.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map