import { clientBundle } from '../../client/tsdown.client.ts'

// hostPhase: the host half (lib) is emitted by the Host build face and the
// browser bundle by the Client face — one package, two programs.
export default clientBundle('@deepseek-ai/dsh-workspace-files', ['lib/types/index.js', 'lib/types/invariant.js'], { hostPhase: true })
