import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      tenantId: string;
      role: string;
      programMemberships: any[];
      currentBatchId?: string;
      accessContext?: {
        batchIds: string[];
        courseIds: string[];
        topicIds?: string[];
      };
    };
    requestId?: string;
  }
}
