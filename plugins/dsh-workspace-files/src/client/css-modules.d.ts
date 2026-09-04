/** CSS Modules type shim for `.module.css` imports (mirrors the client packages). */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
