# RPC Cost Optimization Port Plan

Date: 2026-05-09

This captures the initial Pinto-to-Beanstalk port plan before code changes. It is intentionally redacted: exposed key material is described by source and protection behavior, not copied.

## Pinto Reference Changes

- Pinto frontend:
  - `Reduce conservative RPC waste`
  - `Add app version refresh guard`
- Pinto API:
  - `Optimize RPC usage`
- Pinto bots:
  - `Optimize event RPC polling`
  - `Add shared event dispatcher`
  - `Fix dispatcher routing regressions`
  - `Add Phase 3A RPC cleanup`

## Live Key Exposure Audit

- `https://pinto.money/` currently did not expose full Alchemy RPC URLs in the initial deployed JS/CSS bundle. The source still builds RPC URLs from `VITE_ALCHEMY_API_KEY`, so any configured Vite key is public by design.
- `https://bean.money/` and `https://www.bean.money/` did not expose Alchemy RPC URLs in the initial deployed JS/CSS bundles checked.
- `https://app.bean.money/` exposes Alchemy RPC URLs in the deployed app bundle. The Beanstalk production ETH/Arbitrum key matched the local UI production key and rejected requests with no Origin or a foreign Origin, while accepting the app Origin.
- The Beanstalk app bundle also contains provider-library default/community Alchemy endpoints. One Optimism endpoint accepted a foreign Origin, but it did not match the Beanstalk UI production key.
- Local Beanstalk UI source contains a hardcoded Alchemy NFT API URL in `projects/ui/src/pages/nft.tsx`. It was not seen in the initial live app bundle scan, but it should still be treated as exposed source key material if the route or code is shipped elsewhere.
- Local Pinto UI source contains Alchemy URL construction in `src/utils/wagmi/chains.ts` and `src/pages/DevToolsInstall.tsx`, plus literal Alchemy URL examples/comments in the dev tools page. These should be removed or rotated if they point at live apps.

## Security Posture

- All `VITE_*`/client-side RPC keys should be treated as public identifiers, not secrets.
- Frontend Alchemy keys are acceptable only if separately scoped for browser use, origin/domain restricted, quota limited, and monitored.
- Backend/API/bot keys should use separate Alchemy apps with no browser origin allowlist dependency and should never be bundled into frontends.
- Rotate any key that appears literally in source, comments, docs, old bundles, or test fixtures if it has real permissions or billable quota.

## Port Order

1. Beanstalk API:
   - Port provider request batching and optional RPC request logging.
   - Add historical RPC call caching for explicit `blockTag` reads.
   - Add Multicall3 helpers where Beanstalk endpoints perform repeated per-token reads.
   - Avoid Pinto's Base-only timestamp lookup shortcut unless Beanstalk chain behavior is handled explicitly.
2. Beanstalk bots:
   - Port HTTP RPC request counting.
   - Add a shared event dispatcher for Well, Beanstalk, and Market monitors.
   - De-duplicate contract/event filters and reuse receipts instead of fetching the same transaction receipts repeatedly.
   - Keep Beanstalk-only monitors such as Barn Raise and Contracts Migrated separate until routing is verified.
3. Beanstalk frontend:
   - Port the app version refresh guard.
   - Audit polling intervals and heavy reads against Pinto's lower-cost query defaults.
   - Remove literal Alchemy URL/key examples from UI source where practical.

## Verification Targets

- API: targeted Jest tests around provider creation, cache behavior, and multicall-compatible service paths.
- Bots: targeted unit/integration tests for event source construction, dispatcher routing, and receipt reuse.
- Frontend: build/typecheck if the existing Beanstalk UI dependency state allows it; otherwise, static verification and minimal focused checks.

