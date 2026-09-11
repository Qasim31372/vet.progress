document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('/doctor/login.html');
  const isDashboardPage = window.location.pathname.includes('/doctor/dashboard.html');

  // Token Management
  const tokenKey = 'vet_doctor_token';

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function removeToken() {
    localStorage.removeItem(tokenKey);
  }

  // Auth Redirects
  if (isDashboardPage && !getToken()) {
    window.location.href = '/doctor/login.html';
    return;
  }

  if (isLoginPage && getToken()) {
    window.location.href = '/doctor/dashboard.html';
    return;
  }

  // ==========================================
  // LOGIN / SIGNUP PAGE LOGIC
  // ==========================================
  if (isLoginPage) {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const alertBox = document.getElementById('alertBox');

    showLoginBtn.addEventListener('click', () => {
      showLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white shadow';
      showSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      alertBox.classList.add('hidden');
    });

    showSignupBtn.addEventListener('click', () => {
      showSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-teal-600 text-white shadow';
      showLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      alertBox.classList.add('hidden');
    });

    // Login Submission
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      showAlert('Authenticating doctor account...', 'info');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/doctor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showAlert(data.error || 'Login failed', 'error');
          submitBtn.disabled = false;
          return;
        }

        setToken(data.token);
        showAlert('Login successful! Redirecting to doctor dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/doctor/dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('Network error. Please try again.', 'error');
        submitBtn.disabled = false;
      }
    });

    // Signup Submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const clinicName = document.getElementById('signupClinic').value.trim();
      const specialization = document.getElementById('signupSpec').value.trim();
      const submitBtn = document.getElementById('signupSubmitBtn');

      showAlert('Creating doctor account...', 'info');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/doctor/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, clinicName, specialization })
        });
        const data = await res.json();

        if (!res.ok) {
          showAlert(data.error || 'Signup failed', 'error');
          submitBtn.disabled = false;
          return;
        }

        setToken(data.token);
        showAlert('Doctor account created! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/doctor/dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('Network error during registration.', 'error');
        submitBtn.disabled = false;
      }
    });

    function showAlert(msg, type) {
      alertBox.classList.remove('hidden', 'bg-rose-500/20', 'text-rose-300', 'bg-emerald-500/20', 'text-emerald-300', 'bg-sky-500/20', 'text-sky-300');
      if (type === 'error') alertBox.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
      else if (type === 'success') alertBox.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/30');
      else alertBox.classList.add('bg-sky-500/20', 'text-sky-300', 'border', 'border-sky-500/30');
      alertBox.textContent = msg;
    }
  }

  // ==========================================
  // DASHBOARD PAGE LOGIC
  // ==========================================
  if (isDashboardPage) {
    const docHeaderName = document.getElementById('docHeaderName');
    const docHeaderClinic = document.getElementById('docHeaderClinic');
    const logoutBtn = document.getElementById('logoutBtn');
    const treatmentForm = document.getElementById('treatmentForm');
    const submitCaseBtn = document.getElementById('submitCaseBtn');
    const formAlert = document.getElementById('formAlert');
    const historyList = document.getElementById('historyList');
    const historyLoading = document.getElementById('historyLoading');
    const historyEmpty = document.getElementById('historyEmpty');
    const historyCountBadge = document.getElementById('historyCountBadge');

    // Logout Action
    logoutBtn.addEventListener('click', () => {
      removeToken();
      window.location.href = '/doctor/login.html';
    });

    // Load Doctor Profile
    async function loadDoctorProfile() {
      try {
        const res = await fetch('/api/auth/doctor/me', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!res.ok) {
          removeToken();
          window.location.href = '/doctor/login.html';
          return;
        }

        const data = await res.json();
        if (data.user) {
          docHeaderName.textContent = data.user.name;
          docHeaderClinic.textContent = (data.user.clinicName || 'Private Practice') + (data.user.specialization ? ` • ${data.user.specialization}` : '');
        }
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      }
    }

    // Submit New Treatment Case
    treatmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showFormAlert('Uploading case and files to Google Drive...', 'info');
      submitCaseBtn.disabled = true;

      const formData = new FormData(treatmentForm);

      try {
        const res = await fetch('/api/doctor/treatments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          body: formData
        });

        const data = await res.json();

        if (!res.ok) {
          showFormAlert(data.error || 'Failed to submit treatment case.', 'error');
          submitCaseBtn.disabled = false;
          return;
        }

        showFormAlert('Treatment case submitted successfully! Pending admin approval.', 'success');
        treatmentForm.reset();
        submitCaseBtn.disabled = false;
        loadDoctorHistory();
      } catch (err) {
        console.error('Submit error:', err);
        showFormAlert('Network error during file upload.', 'error');
        submitCaseBtn.disabled = false;
      }
    });

    // Load Doctor Submissions History
    async function loadDoctorHistory() {
      historyLoading.classList.remove('hidden');
      historyList.innerHTML = '';
      historyEmpty.classList.add('hidden');

      try {
        const res = await fetch('/api/doctor/treatments', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        historyLoading.classList.add('hidden');

        if (!data.treatments || data.treatments.length === 0) {
          historyEmpty.classList.remove('hidden');
          historyCountBadge.textContent = '0';
          return;
        }

        historyCountBadge.textContent = data.treatments.length;
        renderHistoryList(data.treatments);
      } catch (err) {
        console.error('Fetch history error:', err);
        historyLoading.classList.add('hidden');
      }
    }

    function renderHistoryList(cases) {
      historyList.innerHTML = cases.map(c => {
        const statusBadge = getStatusBadge(c.approvalStatus);
        const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${statusBadge.class}">
                  ${statusBadge.text}
                </span>
                <h4 class="font-bold text-sm text-slate-900 mt-1 line-clamp-1">${escapeHtml(c.caseTitle)}</h4>
              </div>
              ${c.approvalStatus === 'pending' ? `
                <button onclick="deleteCase('${c.id}')" title="Delete Submission" class="text-xs text-rose-500 hover:text-rose-700 p-1">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span><i class="fa-solid fa-paw text-teal-600"></i> ${escapeHtml(c.animalSpecies)}</span>
              <span>•</span>
              <span>${dateStr}</span>
            </div>

            ${c.rejectionReason ? `
              <div class="bg-rose-50 border border-rose-200 p-2 rounded-lg text-xs text-rose-700 font-medium">
                <strong>Admin Feedback:</strong> ${escapeHtml(c.rejectionReason)}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    window.deleteCase = async (id) => {
      if (!confirm('Are you sure you want to delete this pending submission?')) return;
      try {
        const res = await fetch(`/api/doctor/treatments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
          loadDoctorHistory();
        }
      } catch (err) {
        console.error('Delete case error:', err);
      }
    };

    function showFormAlert(msg, type) {
      formAlert.classList.remove('hidden', 'bg-rose-100', 'text-rose-800', 'bg-emerald-100', 'text-emerald-800', 'bg-sky-100', 'text-sky-800');
      if (type === 'error') formAlert.classList.add('bg-rose-100', 'text-rose-800', 'border', 'border-rose-200');
      else if (type === 'success') formAlert.classList.add('bg-emerald-100', 'text-emerald-800', 'border', 'border-emerald-200');
      else formAlert.classList.add('bg-sky-100', 'text-sky-800', 'border', 'border-sky-200');
      formAlert.textContent = msg;
    }

    function getStatusBadge(status) {
      switch (status) {
        case 'approved': return { text: 'APPROVED & PUBLISHED 🟢', class: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
        case 'rejected': return { text: 'REJECTED 🔴', class: 'bg-rose-100 text-rose-800 border border-rose-300' };
        default: return { text: 'PENDING APPROVAL 🟡', class: 'bg-amber-100 text-amber-800 border border-amber-300' };
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Scroll button helper
    const scrollToFormBtn = document.getElementById('scrollToFormBtn');
    if (scrollToFormBtn) {
      scrollToFormBtn.addEventListener('click', () => {
        document.getElementById('formContainer').scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Initialize
    loadDoctorProfile();
    loadDoctorHistory();
  }
});
