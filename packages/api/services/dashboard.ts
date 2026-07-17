import { getApiClient } from '../client';

export const DashboardApi = {
  getStudentOverview: () => getApiClient().get('/dashboard/student/overview'),
  getAdminMetrics: () => getApiClient().get('/dashboard/admin/metrics'),
};
