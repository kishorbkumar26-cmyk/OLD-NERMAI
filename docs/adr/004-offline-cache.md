# ADR 004: React Native Offline Caching Strategy

## Status
Accepted

## Context
Students require offline access to heavy study materials (large PDFs). However, saving plain PDFs to the device compromises the intellectual property of the academy. We needed an offline architecture that balances security with offline availability and disk space constraints.

## Decision
We implemented a Sandboxed Caching mechanism combined with LRU (Least Recently Used) eviction.

1. **Expo File System Sandboxing**: Rather than installing heavy native AES encryption libraries (which compromise Expo portability and build times), we rely on the host OS (iOS/Android) application sandbox (`FileSystem.documentDirectory`).
2. **Resumable Downloads**: Large PDFs are streamed to disk using `createDownloadResumable` to survive network drops.
3. **Invalidation via Checksum**: When the device reconnects, the cache manager compares both the backend `version` integer and a cryptographic `checksum` to ensure the local file perfectly matches the cloud version.
4. **LRU Eviction**: To prevent out-of-storage errors, the cache is bounded (e.g., 1024 MB). When the threshold is breached, the manager sorts cached resources by `lastOpened` and prunes the oldest files dynamically.

## Consequences
- **Positive**: Maintains high compatibility with Expo, avoids JS memory crashes from decrypting 50MB PDFs in memory, and guarantees device storage is respected.
- **Negative**: Relies on the security of iOS/Android sandbox boundaries; a rooted/jailbroken device could theoretically bypass the application sandbox.
