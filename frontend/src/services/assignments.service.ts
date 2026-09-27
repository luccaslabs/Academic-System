import { api } from './api'
import type { AssignmentResponse, SubmissionResponse } from '../types/api'

export const assignmentsService = {
  getAssignments: async () => {
    return api.get<AssignmentResponse[]>('/assignments')
  },

  getAssignmentsByClass: async (classId: string) => {
    return api.get<AssignmentResponse[]>(`/assignments/class/${classId}`)
  },

  getAssignment: async (id: string) => {
    return api.get<AssignmentResponse>(`/assignments/${id}`)
  },

  createAssignment: async (data: {
    class_id: string
    title: string
    description?: string | null
    due_date: string
    accepts_submissions: boolean
  }) => {
    return api.post<AssignmentResponse>('/assignments', data)
  },

  updateAssignment: async (
    id: string,
    data: {
      title?: string
      description?: string | null
      due_date?: string
      accepts_submissions?: boolean
    }
  ) => {
    return api.put<AssignmentResponse>(`/assignments/${id}`, data)
  },

  deleteAssignment: async (id: string) => {
    return api.delete<void>(`/assignments/${id}`)
  },

  submitAssignment: async (assignmentId: string, data: { content: string }) => {
    return api.post<SubmissionResponse>(`/assignments/${assignmentId}/submissions`, data)
  },

  getSubmissions: async (assignmentId: string) => {
    return api.get<SubmissionResponse[]>(`/assignments/${assignmentId}/submissions`)
  },
}
