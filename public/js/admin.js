document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('/admin/login.html');
  const isDashboardPage = window.location.pathname.includes('/admin/dashboard.html');

  const tokenKey = 'vet_admin_token';

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
    window.location.href = '/admin/login.html';
    return;
  }

  if (isLoginPage && getToken()) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  // ==========================================
  // ADMIN LOGIN PAGE
  // ==========================================
  if (isLoginPage) {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminAlert = document.getElementById('adminAlert');

    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      const loginBtn = document.getElementById('adminLoginBtn');

      showAlert('Authenticating admin session...', 'info');
      loginBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showAlert(data.error || 'Admin authentication failed.', 'error');
          loginBtn.disabled = false;
          return;
        }

        setToken(data.token);
        showAlert('Admin authenticated successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/admin/dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('Network error during admin login.', 'error');
        loginBtn.disabled = false;
      }
    });

    function showAlert(msg, type) {
      adminAlert.classList.remove('hidden', 'bg-rose-500/20', 'text-rose-300', 'bg-emerald-500/20', 'text-emerald-300', 'bg-indigo-500/20', 'text-indigo-300');
      if (type === 'error') adminAlert.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
      else if (type === 'success') adminAlert.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/30');
      else adminAlert.classList.add('bg-indigo-500/20', 'text-indigo-300', 'border', 'border-indigo-500/30');
      adminAlert.textContent = msg;
    }
  }

  // ==========================================
  // ADMIN DASHBOARD PAGE
  // ==========================================
  if (isDashboardPage) {
    const adminHeaderEmail = document.getElementById('adminHeaderEmail');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const restoreDriveBtn = document.getElementById('restoreDriveBtn');
    const syncDriveBtn = document.getElementById('syncDriveBtn');

    // KPI Elements
    const statPending = document.getElementById('statPending');
    const statApproved = document.getElementById('statApproved');
    const statDoctors = document.getElementById('statDoctors');
    const statTotal = document.getElementById('statTotal');
    const tabPendingBadge = document.getElementById('tabPendingBadge');

    // Tab Buttons & Sections
    const tabPending = document.getElementById('tabPending');
    const tabApproved = document.getElementById('tabApproved');
    const tabDoctors = document.getElementById('tabDoctors');

    const pendingQueueSection = document.getElementById('pendingQueueSection');
    const approvedSection = document.getElementById('approvedSection');
    const doctorsSection = document.getElementById('doctorsSection');

    // Rejection Modal
    const rejectModal = document.getElementById('rejectModal');
    const rejectionReasonInput = document.getElementById('rejectionReasonInput');
    const cancelRejectBtn = document.getElementById('cancelRejectBtn');
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');
    let targetRejectId = null;

    // Logout
    adminLogoutBtn.addEventListener('click', () => {
      removeToken();
      window.location.href = '/admin/login.html';
    });

    // Restore Database from Google Drive Action
    if (restoreDriveBtn) {
      restoreDriveBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to pull & restore the latest database backup from Google Drive?')) return;
        restoreDriveBtn.disabled = true;
        restoreDriveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Restoring...';

        try {
          const res = await fetch('/api/admin/restore-drive', {
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

    // Sync Database to Google Drive Action
    if (syncDriveBtn) {
      syncDriveBtn.addEventListener('click', async () => {
        syncDriveBtn.disabled = true;
        syncDriveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';

        try {
          const res = await fetch('/api/admin/sync-drive', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const data = await res.json();
          if (res.ok) {
            alert('SUCCESS: ' + (data.message || 'Current database backed up to Google Drive!'));
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

    // Check Admin Profile
    async function checkAdminProfile() {
      try {
        const res = await fetch('/api/auth/admin/me', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          removeToken();
          window.location.href = '/admin/login.html';
          return;
        }
        const data = await res.json();
        if (data.user) {
          adminHeaderEmail.textContent = `${data.user.name} (${data.user.email})`;
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      }
    }

    // Load Admin Stats
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.stats) {
          statPending.textContent = data.stats.pendingCases || 0;
          statApproved.textContent = data.stats.approvedCases || 0;
          statDoctors.textContent = data.stats.totalDoctors || 0;
          statTotal.textContent = data.stats.totalCases || 0;
          tabPendingBadge.textContent = data.stats.pendingCases || 0;
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    }

    // Load Pending Submissions
    async function loadPendingQueue() {
      const pendingLoading = document.getElementById('pendingLoading');
      const pendingEmpty = document.getElementById('pendingEmpty');
      const pendingGrid = document.getElementById('pendingGrid');

      pendingLoading.classList.remove('hidden');
      pendingEmpty.classList.add('hidden');
      pendingGrid.innerHTML = '';

      try {
        const res = await fetch('/api/admin/treatments?status=pending', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        pendingLoading.classList.add('hidden');

        if (!data.treatments || data.treatments.length === 0) {
          pendingEmpty.classList.remove('hidden');
          return;
        }

        renderPendingCards(data.treatments);
      } catch (err) {
        console.error('Fetch pending error:', err);
        pendingLoading.classList.add('hidden');
      }
    }

    function renderPendingCards(cases) {
      const pendingGrid = document.getElementById('pendingGrid');
      pendingGrid.innerHTML = cases.map(c => {
        const coverImage = (c.images && c.images.length > 0) ? c.images[0].url : 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';
        const isDrive = (c.images && c.images.length > 0 && c.images[0].isDrive);

        return `
          <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  PENDING REVIEW
                </span>
                <h3 class="text-base font-bold text-white mt-2">${escapeHtml(c.caseTitle)}</h3>
                <p class="text-xs text-indigo-300 font-medium">
                  <i class="fa-solid fa-user-doctor"></i> ${escapeHtml(c.doctorName)} (${escapeHtml(c.doctorClinic)})
                </p>
              </div>

              ${isDrive ? `
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-teal-400 border border-teal-500/40 shrink-0">
                  <i class="fa-brands fa-google-drive"></i> Drive Media
                </span>
              ` : ''}
            </div>

            <!-- Image Preview -->
            ${(c.images && c.images.length > 0) ? `
              <div class="relative h-44 rounded-xl overflow-hidden bg-slate-950">
                <img src="${coverImage}" class="w-full h-full object-cover">
              </div>
            ` : ''}

            <!-- Details -->
            <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p><strong>Species:</strong> ${escapeHtml(c.animalSpecies)} | <strong>Category:</strong> ${escapeHtml(c.category)}</p>
              <p><strong>Diagnosis:</strong> ${escapeHtml(c.diagnosis)}</p>
              <p><strong>Medication:</strong> ${escapeHtml(c.medication)}</p>
              <p><strong>Symptoms:</strong> ${escapeHtml(c.symptoms || 'None specified')}</p>
            </div>

            <!-- Moderation Action Buttons -->
            <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-700/60">
              <button onclick="rejectCase('${c.id}')" class="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <i class="fa-solid fa-xmark"></i> Reject Case
              </button>

              <button onclick="approveCase('${c.id}')" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5">
                <i class="fa-solid fa-check"></i> Approve & Publish
              </button>
            </div>

          </div>
        `;
      }).join('');
    }

    // Approve Handler (1-click publish)
    window.approveCase = async (id) => {
      try {
        const res = await fetch(`/api/admin/treatments/${id}/approve`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
          loadStats();
          loadPendingQueue();
        }
      } catch (err) {
        console.error('Approve case error:', err);
      }
    };

    // Reject Modal Handler
    window.rejectCase = (id) => {
      targetRejectId = id;
      rejectionReasonInput.value = '';
      rejectModal.classList.remove('hidden');
    };

    cancelRejectBtn.addEventListener('click', () => {
      rejectModal.classList.add('hidden');
      targetRejectId = null;
    });

    confirmRejectBtn.addEventListener('click', async () => {
      if (!targetRejectId) return;
      const reason = rejectionReasonInput.value.trim();

      try {
        const res = await fetch(`/api/admin/treatments/${targetRejectId}/reject`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ reason })
        });

        if (res.ok) {
          rejectModal.classList.add('hidden');
          targetRejectId = null;
          loadStats();
          loadPendingQueue();
        }
      } catch (err) {
        console.error('Reject case error:', err);
      }
    });

    // Load Approved Directory
    async function loadApprovedDirectory() {
      const approvedGrid = document.getElementById('approvedGrid');
      approvedGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Loading published records...</div>';

      try {
        const res = await fetch('/api/admin/treatments?status=approved', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.treatments || data.treatments.length === 0) {
          approvedGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">No published treatments yet.</div>';
          return;
        }

        approvedGrid.innerHTML = data.treatments.map(c => `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PUBLISHED ON PORTAL 🟢
            </span>
            <h4 class="font-bold text-white text-sm line-clamp-2">${escapeHtml(c.caseTitle)}</h4>
            <p class="text-xs text-slate-400">By ${escapeHtml(c.doctorName)} (${escapeHtml(c.animalSpecies)})</p>
            <p class="text-xs text-slate-300 line-clamp-2"><strong>Diagnosis:</strong> ${escapeHtml(c.diagnosis)}</p>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error fetching approved:', err);
      }
    }

    // Load Doctors Directory
    async function loadDoctorsDirectory() {
      const doctorsGrid = document.getElementById('doctorsGrid');
      doctorsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Loading registered doctors...</div>';

      try {
        const res = await fetch('/api/admin/doctors', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (!data.doctors || data.doctors.length === 0) {
          doctorsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">No registered doctors found.</div>';
          return;
        }

        doctorsGrid.innerHTML = data.doctors.map(d => `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold">
              <i class="fa-solid fa-user-md"></i>
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">${escapeHtml(d.name)}</h4>
              <p class="text-xs text-teal-400">${escapeHtml(d.specialization || 'Veterinarian')}</p>
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
    tabPending.addEventListener('click', () => {
      setTabActive(tabPending, pendingQueueSection);
      loadPendingQueue();
    });

    tabApproved.addEventListener('click', () => {
      setTabActive(tabApproved, approvedSection);
      loadApprovedDirectory();
    });

    tabDoctors.addEventListener('click', () => {
      setTabActive(tabDoctors, doctorsSection);
      loadDoctorsDirectory();
    });

    function setTabActive(btn, section) {
      [tabPending, tabApproved, tabDoctors].forEach(b => {
        b.className = 'tab-btn px-5 py-3 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2';
      });
      btn.className = 'tab-btn px-5 py-3 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-md flex items-center gap-2';

      [pendingQueueSection, approvedSection, doctorsSection].forEach(s => s.classList.add('hidden'));
      section.classList.remove('hidden');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Initialize Admin
    checkAdminProfile();
    loadStats();
    loadPendingQueue();
  }
});
