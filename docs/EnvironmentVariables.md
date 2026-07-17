# UNISTRIX Environment Variables

| Variable | Description | Default / Example | Required |
|----------|-------------|-------------------|----------|
| `PORT` | The port the backend listens on | `3000` | No |
| `NODE_ENV` | Mode of operation (`development`, `test`, `production`) | `development` | No |
| `FIREBASE_PROJECT_ID` | Firebase Project Identifier | `your-project-id` | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | `firebase-adminsdk@...`| Yes |
| `FIREBASE_PRIVATE_KEY`| Firebase Service Account Key | `-----BEGIN PRIVATE KEY...`| Yes |
| `JWT_SECRET` | Secret used for internal token signing | `supersecret` | Yes |
| `AES_SECRET_KEY` | Key for symmetric encryption (must be 32 bytes) | `32-byte-hex-string` | Yes |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | Yes |
| `REDIS_REQUIRED` | Determines if server fails on Redis crash | `false` | No |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging Server Key | - | No |

*Note: In `test` environments, the Firebase Admin SDK initialization will skip credential validation to allow the Emulator to intercept traffic.*
