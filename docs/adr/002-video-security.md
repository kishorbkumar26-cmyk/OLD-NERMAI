# ADR 002: Secure Video Delivery Pipeline

## Status
Accepted

## Context
Commercial video content hosted on YouTube is prone to URL scraping, unlisted link sharing, and piracy. We needed a mechanism to serve YouTube videos through the LMS while obscuring the actual YouTube Video ID, blocking direct downloads, and tying playback strictly to authenticated, authorized users.

## Decision
We engineered a multi-layered Video Security Pipeline:

1. **AES Encrypted Storage**: The raw YouTube video IDs are AES-encrypted at rest in Firestore.
2. **Ephemeral Player Tokens**: When a student requests access to a class video, the backend evaluates the `AccessEngine`. If permitted, it generates a cryptographically signed, short-lived JWT (the "Player Token") containing the decrypted video ID, bound specifically to that user's session.
3. **Isolated Proxy Player**: The frontend embeds a cross-origin `iframe` pointing to a dedicated proxy route (`/player/:token`). The backend verifies the token and dynamically serves a sterile HTML player (via the YouTube IFrame API).
4. **Watermarking & Deterrence**: The player injects a floating watermark (student email/ID). On mobile, `expo-screen-capture` is enforced to prevent screen recording.

## Consequences
- **Positive**: Eradicates casual piracy (link sharing) and deters screen recording. The actual YouTube ID never leaves the proxy server in a readable format.
- **Negative**: Adds a negligible latency overhead to initiate playback due to token signing and iframe negotiation.
