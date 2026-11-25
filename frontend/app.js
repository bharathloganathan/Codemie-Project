const validationRules = {
  studentName: {
    required: true,
    minLength: 2,
    message: 'Student name must be at least 2 characters.'
  },
  studentEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email must be a valid address.'
  },
  studentDepartment: {
    required: true,
    message: 'Department is required.'
  },
  studentPhone: {
    required: false,
    pattern: /^(?=.{7,20}$)\+?[0-9 -]+$/,
    message: 'Phone must contain 7 to 20 digits, spaces or hyphens, with an optional leading +.'
  }
};

function validateStudentForm(fields) {
  const errors = {};
  for (const [fieldName, rule] of Object.entries(validationRules)) {
    const value = String(fields[fieldName] ?? '').trim();
    if (rule.required && !value) {
      errors[fieldName] = rule.message;
      continue;
    }
    if (!value && !rule.required) {
      continue;
    }
    if (rule.minLength && value.length < rule.minLength) {
      errors[fieldName] = rule.message;
      continue;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[fieldName] = rule.message;
    }
  }
  return errors;
}

function $(id) {
  return document.getElementById(id);
}

function showMessage(message, type = 'success') {
  const el = $('message');
  if (!el) {
    window.alert(message);
    return;
  }

  el.textContent = message;
  el.classList.remove('success', 'error');
  el.classList.add(type);
  el.hidden = false;
}

function clearMessage() {
  const el = $('message');
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
  el.classList.remove('success', 'error');
}

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function deriveErrorMessage(payload, fallback) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  }
  return fallback;
}

async function fetchStudents() {
  const response = await fetch('/students', { method: 'GET' });
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(deriveErrorMessage(payload, 'Failed to load students.'));
  }

  // API contract (validated from backend code in this repo): GET /students returns an array.
  if (Array.isArray(payload)) {
    return payload;
  }

  // Defensive fallback if server shape changes.
  if (payload && Array.isArray(payload.students)) {
    return payload.students;
  }

  return [];
}

async function deleteStudentById(id) {
  const response = await fetch(`/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(deriveErrorMessage(payload, 'Failed to delete student.'));
  }

  // Expected: { success: true }
  return payload;
}

function renderStudentList(students) {
  const table = $('student-table');
  const body = $('student-table-body');
  const empty = $('student-list-empty');

  if (!table || !body || !empty) return;

  body.innerHTML = '';

  if (!students || students.length === 0) {
    table.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  table.hidden = false;

  for (const student of students) {
    const tr = document.createElement('tr');

    const id = student?.id ?? '';
    const name = student?.name ?? '';
    const email = student?.email ?? '';
    const department = student?.department ?? '';
    const phone = student?.phone ?? '';
    const status = student?.status ?? '';

    tr.innerHTML = `
      <td>${escapeHtml(id)}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(email)}</td>
      <td>${escapeHtml(department)}</td>
      <td>${escapeHtml(phone || '')}</td>
      <td>${escapeHtml(status || '')}</td>
      <td>
        <div class="actions">
          <button type="button" class="btn-danger" data-student-id="${escapeHtmlAttr(id)}">Delete</button>
        </div>
      </td>
    `;

    const deleteButton = tr.querySelector('button[data-student-id]');
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        const studentId = deleteButton.getAttribute('data-student-id');
        if (!studentId) return;

        // optional confirmation; lightweight and in-scope
        const ok = window.confirm(`Delete student ${studentId}?`);
        if (!ok) return;

        deleteButton.disabled = true;
        try {
          await deleteStudentById(studentId);
          showMessage('Student deleted successfully.', 'success');
          await loadStudents();
        } catch (e) {
          showMessage(e.message || 'Failed to delete student.', 'error');
          deleteButton.disabled = false;
        }
      });
    }

    body.appendChild(tr);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeHtmlAttr(value) {
  // Same as escapeHtml for our simple attribute usage
  return escapeHtml(value);
}

async function loadStudents() {
  try {
    const students = await fetchStudents();
    renderStudentList(students);
  } catch (e) {
    renderStudentList([]);
    showMessage(e.message || 'Failed to load students.', 'error');
  }
}

async function submitStudentForm(event) {
  event.preventDefault();
  clearMessage();

  const form = event.currentTarget;
  const formData = Object.fromEntries(new FormData(form).entries());
  const errors = validateStudentForm(formData);
  if (Object.keys(errors).length > 0) {
    showMessage(Object.values(errors)[0], 'error');
    return;
  }

  const payload = new URLSearchParams({
    name: formData.studentName,
    email: formData.studentEmail,
    department: formData.studentDepartment,
    phone: formData.studentPhone
  });

  try {
    const response = await fetch('/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: payload.toString()
    });

    const body = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(deriveErrorMessage(body, 'Submission failed.'));
    }

    showMessage('Student record created successfully.', 'success');
    form.reset();
    await loadStudents();
  } catch (error) {
    showMessage(error.message || 'Submission failed.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = $('student-form');
  if (form) {
    form.addEventListener('submit', submitStudentForm);
  }

  loadStudents();
});
