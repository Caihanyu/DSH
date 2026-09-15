// plugins/dsh-workspace-files/src/invariant.ts
var PACKAGE_NAME = "@deepseek-ai/dsh-workspace-files";
var name = "workspace-files-invariant";
var inject = ["invariants"];
var install = () => {
};
var apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
export {
  apply,
  inject,
  name
};
