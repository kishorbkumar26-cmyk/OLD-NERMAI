# Unified Resource Management System & Secure Content Delivery Engine (Web + React Native)

## Objective

Implement a unified Resource Management System that securely delivers learning resources while minimizing bandwidth, maximizing cache efficiency, and supporting both the React Web application and the future React Native mobile application.

The system must reuse the same security model as the video streaming architecture and support offline mobile access.

## Core Architectural Principles

### 1. Shared Secure Content Delivery Engine

Create a reusable Secure Content Delivery Engine responsible for:

- Authentication
- Authorization
- Access Rules
- Batch Validation
- Premium Validation
- Token Generation
- Signed URL Generation
- Resource Access Logging

This engine should be shared by:
Videos, Resources, Future Assignments, Images, PPT, ZIP, Documents.

### 2. Single Storage Provider

Google Drive is **NOT** a runtime storage provider. It is only an import source.

Flow:
1. Admin provides Google Drive Link
2. Backend downloads file
3. Virus Scan (Future)
4. Checksum Generation
5. Upload to Firebase Storage
6. Encrypt Storage Path
7. Firestore Resource Record

Every resource is ultimately stored inside Firebase Storage.

**Advantages**:
- One delivery pipeline
- One caching strategy
- No Drive API quota
- No Drive permission issues
- Better CDN performance
- Better mobile support

## Resource Model

Resources are independent from the syllabus hierarchy. A resource may optionally belong to:
- Entire Course
- Subject
- Topic
- Standalone

### Supported Resource Types
PDF, PPT, DOC, DOCX, XLS, XLSX, ZIP, IMAGE, TEXT.
Future additions should require no architectural changes.

## Backend Architecture

### Shared Access Engine (`backend/core/security/AccessEngine.ts`)
**Responsibilities:**
- Verify JWT
- Verify Tenant
- Verify Enrollment
- Verify Premium Status
- Verify Batch
- Verify Resource Visibility
- Generate Short-lived Resource Token
- Generate Firebase Signed URL
- Audit Access

### Resources Module (`backend/modules/resources/`)
**Resource Schema:**
```typescript
interface IResource {
    id?: string;
    title: string;
    description: string;
    type: 'PDF' | 'PPT' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'ZIP' | 'IMAGE' | 'TEXT';
    provider: 'firebase_storage';
    visibility: 'public' | 'private' | 'restricted';
    storagePath: string; // Encrypted
    checksum: string;
    version: number;
    fileSize: number;
    mimeType: string;
    thumbnail?: string;
    pageCount?: number;
    tags?: string[];
    courseId?: string;
    subjectId?: string;
    topicId?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
```

### Secure Delivery Flow
1. Student `GET /api/resources/:id/access`
2. `AccessEngine` verifies rules and generates Signed URL
3. Returns `{ token, checksum, version, mimeType, signedUrl, expiresAt }`

Signed URLs should expire after approximately 15 minutes.

## Web Implementation

### Resource Viewer (`apps/web/student/LMS/ResourceViewer.tsx`)
- PDF -> `react-pdf` -> PDF.js
- Non-PDF -> Browser Viewer -> Secure Download

**UI Features:**
- Moving watermark (Student Name, Email, Timestamp, Random movement)
- Disable right click, disable selection, hide toolbar where possible, print deterrents, security notice.

### Resource Organization
Display:
- General Resources
- Course Resources
- Subject Resources
- Topic Resources
Each section should collapse/expand.

### HTTP Optimization
Support `HTTP Range Requests`, `ETag`, `Cache-Control`, `If-None-Match`. Large PDFs should stream incrementally.

## React Native Implementation

**Storage**: Use `expo-file-system`.
**Metadata**: Use `expo-sqlite` or `react-native-mmkv`.
**Local Cache**: Store `resourceId`, `version`, `checksum`, `localPath`, `downloadedAt`, `lastOpened`, `favorite`.

**Cache Validation**:
1. Open Resource -> Backend -> `version`, `checksum`.
2. If Same -> Open Local Copy.
3. If Different -> Download New Version -> Replace Local Copy.

**Offline Mode**: After first successful download, Student can open resource and search inside PDF without internet.

**Mobile Security Deterrents**:
Stored inside application storage, use encrypted file storage where feasible, disable Share Intent, disable Export, disable "Open With", disable screenshots if required, block Android sharing.

**Mobile Viewer**:
- PDF -> Native PDF Viewer
- Images -> Native Image Viewer
- ZIP -> Download Manager
- PPT -> Embedded Viewer

## Bandwidth Optimization
- **Version-Based Cache**: Every resource has `version` and `checksum`. Only download when changed.
- **Incremental Loading**: Large PDFs use HTTP Range Requests to load pages on demand.
- **Cache Headers**: Use `ETag`, `Cache-Control`, `Last-Modified`.
- **Signed URLs**: Only generated when access is approved. Expire automatically. No permanent Storage URLs are exposed.
- **Download Strategy**: Web (Browser Cache -> ETag Validation) / Mobile (Encrypted Local Cache -> Version Validation).

## Shared APIs
Both React Web and React Native must use the exact same backend endpoints:
- `GET /api/resources/:id/access`
- `GET /api/resources`
- `POST /api/resources`
- `PUT /api/resources/:id`
- `DELETE /api/resources/:id`
