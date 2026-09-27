import { api } from './client'
import type { AssignmentResponse, SubmissionResponse } from './types'

interface AssignmentInput {
  class_id: string
  title: string
  description?: string | null
  due_date: string
  accepts_submissions: boolean
}

export const assignmentsApi = {
  list: () => api.get<AssignmentResponse[]>('/assignments'),
  listByClass: (classId: string) => api.get<AssignmentResponse[]>(`/assignments/class/${classId}`),
  get: (id: string) => api.get<AssignmentResponse>(`/assignments/${id}`),
  create: (data: AssignmentInput) => api.post<AssignmentResponse>('/assignments', data),
  update: (id: string, data: Partial<Omit<AssignmentInput, 'class_id'>>) =>
    api.put<AssignmentResponse>(`/assignments/${id}`, data),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  submit: (id: string, content: string) => api.post<SubmissionResponse>(`/assignments/${id}/submissions`, { content }),
  listSubmissions: (id: string) => api.get<SubmissionResponse[]>(`/assignments/${id}/submissions`),
}