const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MODEL_API_BASE_URL = import.meta.env.VITE_MODEL_API_BASE_URL || "http://localhost:8000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export const api = {
  register: (data) => request("/api/users/register", { method: "POST", body: data }),
  login: (data) => request("/api/users/login", { method: "POST", body: data }),
  getCurrentUser: (token) => request("/api/users/me", { token }),
  updateMySection: (token, section) => request("/api/users/me/section", { method: "PATCH", body: { section }, token }),
  getSecurityQuestion: (email) => request("/api/users/forgot-password/question", { method: "POST", body: { email } }),
  resetPasswordWithQuestion: (email, securityAnswer, password) => request("/api/users/reset-password/question", { method: "POST", body: { email, securityAnswer, password } }),
  fetchStudents: (token, section) => {
    const url = section ? `/api/students?section=${encodeURIComponent(section)}` : "/api/students";
    return request(url, { token });
  },
  createStudent: (token, data) => request("/api/students", { method: "POST", body: data, token }),
  updateStudentSection: (token, studentId, section) => request(`/api/students/${studentId}/section`, { method: "PATCH", body: { section }, token }),
  fetchEssays: (token) => request("/api/essays", { token }),
  fetchSubmissionsByAssignment: (token, assignmentId) => request(`/api/essays/assignment/${assignmentId}`, { token }),
  fetchMySubmissions: (token) => request("/api/essays/my-submissions", { token }),
  saveEssay: (token, data) => request("/api/essays", { method: "POST", body: data, token }),
  submitAssignment: (token, data) => request("/api/essays/submit", { method: "POST", body: data, token }),
  fetchAssignments: (token) => request("/api/assignments", { token }),
  createAssignment: (token, data) => request("/api/assignments", { method: "POST", body: data, token }),
  getAssignment: (token, id) => request(`/api/assignments/${id}`, { token }),
};

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getModelApiBaseUrl() {
  return MODEL_API_BASE_URL;
}

export async function evaluateEssayWithAI({ submissionText, studentName, assignmentId, totalMarks }) {
  try {
    const response = await fetch(`${MODEL_API_BASE_URL}/api/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submission_text: submissionText,
        student_name: studentName,
        assignment_id: assignmentId,
        total_marks: totalMarks ? Number(totalMarks) : null,
      }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.detail || payload?.message || `AI evaluation failed (${response.status})`;
      throw new Error(message);
    }

    return payload;
  } catch (err) {
    // Handle network errors (server not running, CORS, etc.)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to AI model server at ${MODEL_API_BASE_URL}. ` +
        `Please ensure the model service is running on port 8000. ` +
        `See RUN.md for instructions on starting the server.`
      );
    }
    // Re-throw other errors as-is
    throw err;
  }
}

