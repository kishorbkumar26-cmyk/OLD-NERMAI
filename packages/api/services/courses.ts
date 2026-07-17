import { getApiClient } from '../client';

export const CourseApi = {
  // Courses
  listCourses: () => getApiClient().get('/courses'),
  getCourse: (id: string) => getApiClient().get(`/courses/${id}`),
  createCourse: (data: any) => getApiClient().post('/courses', data),
  updateCourse: (id: string, data: any) => getApiClient().put(`/courses/${id}`, data),
  deleteCourse: (id: string) => getApiClient().delete(`/courses/${id}`),

  // Subjects
  listAllSubjects: () => getApiClient().get('/subjects'),
  listSubjectsByCourse: (courseId: string) => getApiClient().get(`/courses/${courseId}/subjects`),
  createSubject: (courseId: string, data: any) => getApiClient().post(`/courses/${courseId}/subjects`, data),
  updateSubject: (id: string, data: any) => getApiClient().put(`/subjects/${id}`, data),
  deleteSubject: (id: string) => getApiClient().delete(`/subjects/${id}`),

  // Topics
  listAllTopics: () => getApiClient().get('/topics'),
  listTopicsBySubject: (subjectId: string) => getApiClient().get(`/subjects/${subjectId}/topics`),
  createTopic: (subjectId: string, data: any) => getApiClient().post(`/subjects/${subjectId}/topics`, data),
  updateTopic: (id: string, data: any) => getApiClient().put(`/topics/${id}`, data),
  deleteTopic: (id: string) => getApiClient().delete(`/topics/${id}`),

  // Classes
  listAllClasses: () => getApiClient().get('/classes'),
  listClassesByTopic: (topicId: string) => getApiClient().get(`/topics/${topicId}/classes`),
  createClass: (topicId: string, data: any) => getApiClient().post(`/topics/${topicId}/classes`, data),
  updateClass: (id: string, data: any) => getApiClient().put(`/classes/${id}`, data),
  deleteClass: (id: string) => getApiClient().delete(`/classes/${id}`),
  getClassPlaybackAccess: (id: string) => getApiClient().get(`/classes/${id}/access`),
  uploadClassRecording: (id: string, data: any) => getApiClient().put(`/classes/${id}/recording`, data),
  startLiveSession: (id: string) => getApiClient().post(`/classes/${id}/start`),
  extendLiveSession: (id: string, data: { minutes: number, reason?: string }) => getApiClient().post(`/classes/${id}/extend`, data),
  endLiveSession: (id: string) => getApiClient().post(`/classes/${id}/end`),
};
