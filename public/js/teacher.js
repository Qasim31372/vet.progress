document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('/teacher/login.html') || window.location.pathname.includes('/admin/login.html');
  const isDashboardPage = window.location.pathname.includes('/teacher/dashboard.html') || window.location.pathname.includes('/admin/dashboard.html');

  const tokenKey = 'vet_teacher_token';
  const legacyAdminKey = 'vet_admin_token';

  function getToken() {
    return localStorage.getItem(tokenKey) || localStorage.getItem(legacyAdminKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(legacyAdminKey, token);
  }

  function removeToken() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(legacyAdminKey);
  }

  // Auth Redirects
  if (isDashboardPage && !getToken()) {
    window.location.href = '/teacher/login.html';
    return;
  }

  if (isLoginPage && getToken()) {
    window.location.href = '/teacher/dashboard.html';
    return;
  }

  // ==========================================
  // TEACHER LOGIN & SIGNUP PAGE
  // ==========================================
  if (isLoginPage) {
    const teacherLoginForm = document.getElementById('teacherLoginForm');
    const teacherSignupForm = document.getElementById('teacherSignupForm');
    const showTeacherLoginBtn = document.getElementById('showTeacherLoginBtn');
    const showTeacherSignupBtn = document.getElementById('showTeacherSignupBtn');
    const teacherAlert = document.getElementById('teacherAlert');

    if (showTeacherLoginBtn && showTeacherSignupBtn) {
      showTeacherLoginBtn.addEventListener('click', () => {
        showTeacherLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow';
        showTeacherSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
        if (teacherLoginForm) teacherLoginForm.classList.remove('hidden');
        if (teacherSignupForm) teacherSignupForm.classList.add('hidden');
        hideAlert();
      });

      showTeacherSignupBtn.addEventListener('click', () => {
        showTeacherSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow';
        showTeacherLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
        if (teacherSignupForm) teacherSignupForm.classList.remove('hidden');
        if (teacherLoginForm) teacherLoginForm.classList.add('hidden');
        hideAlert();
      });
    }

    // Teacher Login Form Submit
    if (teacherLoginForm) {
      teacherLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('teacherLoginEmail').value.trim();
        const password = document.getElementById('teacherLoginPassword').value;
        const loginBtn = document.getElementById('teacherLoginBtn');

        showAlert('Authenticating teacher session...', 'info');
        loginBtn.disabled = true;

        try {
          const res = await fetch('/api/auth/teacher/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();

          if (!res.ok) {
            showAlert(data.error || 'Authentication failed. Please verify credentials.', 'error');
            loginBtn.disabled = false;
            return;
          }

          setToken(data.token);
          showAlert('Teacher authenticated successfully! Opening Dashboard...', 'success');
          setTimeout(() => {
            window.location.href = '/teacher/dashboard.html';
          }, 800);
        } catch (err) {
          showAlert('Network error during authentication.', 'error');
          loginBtn.disabled = false;
        }
      });
    }

    // Teacher Signup Form Submit
    if (teacherSignupForm) {
      teacherSignupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('teacherSignupName').value.trim();
        const email = document.getElementById('teacherSignupEmail').value.trim();
        const password = document.getElementById('teacherSignupPassword').value;
        const department = document.getElementById('teacherSignupDepartment').value.trim();
        const university = document.getElementById('teacherSignupUniversity').value.trim();
        const signupBtn = document.getElementById('teacherSignupBtn');

        showAlert('Registering faculty account...', 'info');
        signupBtn.disabled = true;

        try {
          const res = await fetch('/api/auth/teacher/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, department, university })
          });
          const data = await res.json();

          if (!res.ok) {
            showAlert(data.error || 'Registration failed.', 'error');
            signupBtn.disabled = false;
            return;
          }

          setToken(data.token);
          showAlert('Faculty account registered successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = '/teacher/dashboard.html';
          }, 1000);
        } catch (err) {
          showAlert('Network error during registration.', 'error');
          signupBtn.disabled = false;
        }
      });
    }

    function showAlert(msg, type) {
      if (!teacherAlert) return;
      teacherAlert.classList.remove('hidden', 'bg-rose-500/20', 'text-rose-300', 'bg-emerald-500/20', 'text-emerald-300', 'bg-indigo-500/20', 'text-indigo-300');
      if (type === 'error') teacherAlert.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
      else if (type === 'success') teacherAlert.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/30');
      else teacherAlert.classList.add('bg-indigo-500/20', 'text-indigo-300', 'border', 'border-indigo-500/30');
      teacherAlert.textContent = msg;
    }

    function hideAlert() {
      if (teacherAlert) teacherAlert.classList.add('hidden');
    }
  }

  // ==========================================
  // TEACHER DASHBOARD PAGE
  // ==========================================
  if (isDashboardPage) {
    const teacherHeaderEmail = document.getElementById('teacherHeaderEmail');
    const welcomeTeacherName = document.getElementById('welcomeTeacherName');
    const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
    const restoreDriveBtn = document.getElementById('restoreDriveBtn');
    const syncDriveBtn = document.getElementById('syncDriveBtn');

    // KPI Elements
    const statPending = document.getElementById('statPending');
    const statApproved = document.getElementById('statApproved');
    const statStudents = document.getElementById('statStudents');
    const statDoctors = document.getElementById('statDoctors');
    const statTotal = document.getElementById('statTotal');
    const tabPendingBadge = document.getElementById('tabPendingBadge');

    // Tab Buttons & Sections
    const tabPending = document.getElementById('tabPending');
    const tabApproved = document.getElementById('tabApproved');
    const tabStudents = document.getElementById('tabStudents');
    const tabDoctors = document.getElementById('tabDoctors');

    const pendingQueueSection = document.getElementById('pendingQueueSection');
    const approvedSection = document.getElementById('approvedSection');
    const studentsSection = document.getElementById('studentsSection');
    const doctorsSection = document.getElementById('doctorsSection');

    // Rejection Modal
    const rejectModal = document.getElementById('rejectModal');
    const rejectionReasonInput = document.getElementById('rejectionReasonInput');
    const cancelRejectBtn = document.getElementById('cancelRejectBtn');
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');
    let targetRejectId = null;

    // Logout
    if (teacherLogoutBtn) {
      teacherLogoutBtn.addEventListener('click', () => {
        removeToken();
        window.location.href = '/teacher/login.html';
      });
    }

    // Restore Database from Google Drive
    if (restoreDriveBtn) {
      restoreDriveBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to pull & restore the latest database backup from Google Drive?')) return;
        restoreDriveBtn.disabled = true;
        restoreDriveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Restoring...';

        try {
          const res = await fetch('/api/teacher/restore-drive', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const data = await res.json();
          if (res.ok) {
            alert('SUCCESS: ' + (data.message || 'Database restored from Google Drive!'));
            loadStats();
            loadPendingQueue();
          } else {
            alert('ERROR: ' + (data.error || 'Failed to restore database from Google Drive.'));
          }
        } catch (err) {
          alert('Network error while retrieving database from Drive.');
        } finally {
          restoreDriveBtn.disabled = false;
          restoreDriveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Restore from Drive';
        }
      });
    }

    // Sync Database to Google Drive
    if (syncDriveBtn) {
      syncDriveBtn.addEventListener('click', async () => {
        syncDriveBtn.disabled = true;
        syncDriveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';

        try {
          const res = await fetch('/api/teacher/sync-drive', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const data = await res.json();
          if (res.ok) {
            alert('SUCCESS: ' + (data.message || 'Database backed up to Google Drive!'));
          } else {
            alert('ERROR: ' + (data.error || 'Failed to sync database to Drive.'));
          }
        } catch (err) {
          alert('Network error while backing up database to Drive.');
        } finally {
          syncDriveBtn.disabled = false;
          syncDriveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sync to Drive';
        }
      });
    }

    // Fetch Teacher Profile
    async function checkTeacherProfile() {
      try {
        const res = await fetch('/api/auth/teacher/me', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          removeToken();
          window.location.href = '/teacher/login.html';
          return;
        }
        const data = await res.json();
        if (data.user) {
          if (teacherHeaderEmail) teacherHeaderEmail.textContent = `${data.user.name} • ${data.user.department || data.user.specialization || 'Faculty'}`;
          if (welcomeTeacherName) welcomeTeacherName.textContent = data.user.name;
        }
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
      }
    }

    // Load Stats
    async function loadStats() {
      try {
        const res = await fetch('/api/teacher/stats', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.stats) {
          if (statPending) statPending.textContent = data.stats.pendingCases || 0;
          if (statApproved) statApproved.textContent = data.stats.approvedCases || 0;
          if (statStudents) statStudents.textContent = data.stats.totalStudents || 0;
          if (statDoctors) statDoctors.textContent = data.stats.totalDoctors || 0;
          if (statTotal) statTotal.textContent = data.stats.totalCases || 0;
          if (tabPendingBadge) tabPendingBadge.textContent = data.stats.pendingCases || 0;
        }
      } catch (err) {
        console.error('Error fetching teacher stats:', err);
      }
    }

    // Load Pending Submissions
    async function loadPendingQueue() {
      const pendingLoading = document.getElementById('pendingLoading');
      const pendingEmpty = document.getElementById('pendingEmpty');
      const pendingGrid = document.getElementById('pendingGrid');

      if (pendingLoading) pendingLoading.classList.remove('hidden');
      if (pendingEmpty) pendingEmpty.classList.add('hidden');
      if (pendingGrid) pendingGrid.innerHTML = '';

      try {
        const res = await fetch('/api/teacher/treatments?status=pending', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (pendingLoading) pendingLoading.classList.add('hidden');

        if (!data.treatments || data.treatments.length === 0) {
          if (pendingEmpty) pendingEmpty.classList.remove('hidden');
          return;
        }

        renderPendingCards(data.treatments);
      } catch (err) {
        console.error('Fetch pending error:', err);
        if (pendingLoading) pendingLoading.classList.add('hidden');
      }
    }

    function renderPendingCards(cases) {
      const pendingGrid = document.getElementById('pendingGrid');
      if (!pendingGrid) return;

      pendingGrid.innerHTML = cases.map(c => {
        const coverImage = (c.images && c.images.length > 0) ? c.images[0].url : 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';
        const isDrive = (c.images && c.images.length > 0 && c.images[0].isDrive);

        return `
          <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <i class="fa-solid fa-clock"></i> PENDING TEACHER VERIFICATION
                </span>
                <h3 class="text-base font-bold text-white mt-2">${escapeHtml(c.caseTitle)}</h3>
                <p class="text-xs text-indigo-300 font-medium">
                  <i class="fa-solid fa-user-md"></i> Dr. ${escapeHtml(c.doctorName)} (${escapeHtml(c.doctorClinic)})
                </p>
              </div>

              <span class="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                ${escapeHtml(c.category)}
              </span>
            </div>

            <!-- Media Gallery -->
            ${(c.images && c.images.length > 0) ? `
              <div class="flex gap-2 overflow-x-auto py-1">
                ${c.images.map(img => `
                  <a href="${img.url}" target="_blank" class="block h-20 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-700 relative group">
                    <img src="${img.url}" alt="Case Image" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      <i class="fa-solid fa-expand mr-1"></i> View
                    </div>
                  </a>
                `).join('')}
              </div>
            ` : '<p class="text-xs text-slate-500 italic">No media photos attached.</p>'}

            <!-- Clinical Facts -->
            <div class="bg-slate-900/60 rounded-xl p-3.5 space-y-2 text-xs border border-slate-700/50">
              <p><strong class="text-slate-400">Species/Breed:</strong> <span class="text-slate-200">${escapeHtml(c.animalSpecies)}</span></p>
              <p><strong class="text-slate-400">Symptoms:</strong> <span class="text-slate-300">${escapeHtml(c.symptoms || 'None')}</span></p>
              <p><strong class="text-slate-400">Diagnosis:</strong> <span class="text-white font-semibold">${escapeHtml(c.diagnosis)}</span></p>
              <p><strong class="text-emerald-400">Prescribed Rx:</strong> <span class="text-slate-200">${escapeHtml(c.medication)}</span></p>
              <p><strong class="text-slate-400">Status:</strong> <span class="capitalize text-slate-300">${escapeHtml(c.outcomeStatus)}</span></p>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button onclick="window.promptTeacherReject('${c.id}')"
                class="px-4 py-2.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <i class="fa-solid fa-xmark"></i> Reject & Feedback
              </button>
              <button onclick="window.approveCaseForStudents('${c.id}')"
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-1.5">
                <i class="fa-solid fa-graduation-cap"></i> Approve for Students
              </button>
            </div>

          </div>
        `;
      }).join('');
    }

    // Approve Case Action
    window.approveCaseForStudents = async (id) => {
      if (!confirm('Approve this clinical case study for publication on the Student Learning Hub?')) return;

      try {
        const res = await fetch(`/api/teacher/treatments/${id}/approve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();

        if (res.ok) {
          alert('SUCCESS: Case approved and published for students!');
          loadStats();
          loadPendingQueue();
        } else {
          alert('ERROR: ' + (data.error || 'Failed to approve case.'));
        }
      } catch (err) {
        alert('Network error approving case study.');
      }
    };

    // Rejection Modal
    window.promptTeacherReject = (id) => {
      targetRejectId = id;
      if (rejectionReasonInput) rejectionReasonInput.value = '';
      if (rejectModal) rejectModal.classList.remove('hidden');
    };

    if (cancelRejectBtn && rejectModal) {
      cancelRejectBtn.addEventListener('click', () => {
        rejectModal.classList.add('hidden');
        targetRejectId = null;
      });
    }

    if (confirmRejectBtn && rejectModal) {
      confirmRejectBtn.addEventListener('click', async () => {
        if (!targetRejectId) return;
        const reason = rejectionReasonInput.value.trim();
        if (!reason) {
          alert('Please enter a feedback note for the doctor.');
          return;
        }

        try {
          const res = await fetch(`/api/teacher/treatments/${targetRejectId}/reject`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
          });
          const data = await res.json();

          if (res.ok) {
            alert('Case rejected with teacher feedback.');
            rejectModal.classList.add('hidden');
            targetRejectId = null;
            loadStats();
            loadPendingQueue();
          } else {
            alert('ERROR: ' + (data.error || 'Failed to reject case.'));
          }
        } catch (err) {
          alert('Network error rejecting case study.');
        }
      });
    }

    // Load Approved Directory
    async function loadApprovedDirectory() {
      const approvedGrid = document.getElementById('approvedGrid');
      if (!approvedGrid) return;
      approvedGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Loading published student cases...</div>';

      try {
        const res = await fetch('/api/teacher/treatments?status=approved', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.treatments || data.treatments.length === 0) {
          approvedGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">No published student cases found.</div>';
          return;
        }

        approvedGrid.innerHTML = data.treatments.map(c => `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                PUBLISHED FOR STUDENTS
              </span>
              <span class="text-xs text-slate-400">${escapeHtml(c.category)}</span>
            </div>
            <h4 class="text-sm font-bold text-white line-clamp-2">${escapeHtml(c.caseTitle)}</h4>
            <p class="text-xs text-slate-400"><strong class="text-slate-300">Species:</strong> ${escapeHtml(c.animalSpecies)}</p>
            <p class="text-xs text-slate-400"><strong class="text-slate-300">Doctor:</strong> ${escapeHtml(c.doctorName)}</p>
            <p class="text-xs text-emerald-400 font-mono mt-1">${escapeHtml(c.diagnosis)}</p>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error fetching approved:', err);
      }
    }

    // Load Students Directory
    async function loadStudentsDirectory() {
      const studentsGrid = document.getElementById('studentsGrid');
      if (!studentsGrid) return;
      studentsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Loading enrolled students...</div>';

      try {
        const res = await fetch('/api/teacher/students', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.students || data.students.length === 0) {
          studentsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">No registered students yet. Students can register from the Student Portal.</div>';
          return;
        }

        studentsGrid.innerHTML = data.students.map(s => `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">${escapeHtml(s.name)}</h4>
              <p class="text-xs text-teal-400">${escapeHtml(s.university || 'Veterinary Institute')}</p>
              <p class="text-xs text-slate-400 mt-1">${escapeHtml(s.semester || 'DVM Student')}</p>
              <p class="text-[11px] text-slate-500 font-mono mt-0.5">${escapeHtml(s.email)}</p>
            </div>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }

    // Load Doctors Directory
    async function loadDoctorsDirectory() {
      const doctorsGrid = document.getElementById('doctorsGrid');
      if (!doctorsGrid) return;
      doctorsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Loading registered doctors...</div>';

      try {
        const res = await fetch('/api/teacher/doctors', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.doctors || data.doctors.length === 0) {
          doctorsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">No registered doctors found.</div>';
          return;
        }

        doctorsGrid.innerHTML = data.doctors.map(d => `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
              <i class="fa-solid fa-user-md"></i>
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">${escapeHtml(d.name)}</h4>
              <p class="text-xs text-indigo-400">${escapeHtml(d.specialization || 'Veterinarian')}</p>
              <p class="text-xs text-slate-400 mt-1">${escapeHtml(d.clinicName || 'Private Practice')}</p>
              <p class="text-[11px] text-slate-500 font-mono mt-0.5">${escapeHtml(d.email)}</p>
            </div>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    }

    // Tab Switches
    if (tabPending) {
      tabPending.addEventListener('click', () => {
        setTabActive(tabPending, pendingQueueSection);
        loadPendingQueue();
      });
    }

    if (tabApproved) {
      tabApproved.addEventListener('click', () => {
        setTabActive(tabApproved, approvedSection);
        loadApprovedDirectory();
      });
    }

    if (tabStudents) {
      tabStudents.addEventListener('click', () => {
        setTabActive(tabStudents, studentsSection);
        loadStudentsDirectory();
      });
    }

    if (tabDoctors) {
      tabDoctors.addEventListener('click', () => {
        setTabActive(tabDoctors, doctorsSection);
        loadDoctorsDirectory();
      });
    }

    function setTabActive(btn, section) {
      [tabPending, tabApproved, tabStudents, tabDoctors].filter(Boolean).forEach(b => {
        b.className = 'tab-btn px-5 py-3 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2';
      });
      btn.className = 'tab-btn px-5 py-3 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-md flex items-center gap-2';

      [pendingQueueSection, approvedSection, studentsSection, doctorsSection].filter(Boolean).forEach(s => s.classList.add('hidden'));
      section.classList.remove('hidden');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Initialize Teacher Dashboard
    checkTeacherProfile();
    loadStats();
    loadPendingQueue();
  }
});
