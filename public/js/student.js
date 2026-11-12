document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('/student/login.html');
  const isDashboardPage = window.location.pathname.includes('/student/dashboard.html');

  const tokenKey = 'vet_student_token';
  const bookmarkKey = 'vet_student_bookmarks';

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function removeToken() {
    localStorage.removeItem(tokenKey);
  }

  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveBookmarks(bookmarks) {
    localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
  }

  function toggleBookmark(caseId) {
    let bookmarks = getBookmarks();
    const idx = bookmarks.indexOf(caseId);
    let isNowBookmarked = false;
    if (idx !== -1) {
      bookmarks.splice(idx, 1);
      isNowBookmarked = false;
    } else {
      bookmarks.push(caseId);
      isNowBookmarked = true;
    }
    saveBookmarks(bookmarks);
    return isNowBookmarked;
  }

  // ==========================================
  // STUDENT LOGIN & SIGNUP PAGE
  // ==========================================
  if (isLoginPage) {
    if (getToken()) {
      window.location.href = '/student/dashboard.html';
      return;
    }

    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const studentLoginForm = document.getElementById('studentLoginForm');
    const studentSignupForm = document.getElementById('studentSignupForm');
    const alertBox = document.getElementById('alertBox');

    showLoginBtn.addEventListener('click', () => {
      showLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-teal-600 text-white shadow';
      showSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
      studentLoginForm.classList.remove('hidden');
      studentSignupForm.classList.add('hidden');
      hideAlert();
    });

    showSignupBtn.addEventListener('click', () => {
      showSignupBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all bg-teal-600 text-white shadow';
      showLoginBtn.className = 'py-2.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white';
      studentSignupForm.classList.remove('hidden');
      studentLoginForm.classList.add('hidden');
      hideAlert();
    });

    // Handle Student Login
    studentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      showAlert('Authenticating student account...', 'info');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/student/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showAlert(data.error || 'Student login failed.', 'error');
          submitBtn.disabled = false;
          return;
        }

        setToken(data.token);
        showAlert('Login successful! Redirecting to Student Dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/student/dashboard.html';
        }, 800);
      } catch (err) {
        showAlert('Network error during student login.', 'error');
        submitBtn.disabled = false;
      }
    });

    // Handle Student Signup
    studentSignupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const university = document.getElementById('signupUniversity').value.trim();
      const semester = document.getElementById('signupSemester').value.trim();
      const submitBtn = document.getElementById('signupSubmitBtn');

      showAlert('Creating your student profile...', 'info');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/student/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, university, semester })
        });
        const data = await res.json();

        if (!res.ok) {
          showAlert(data.error || 'Registration failed.', 'error');
          submitBtn.disabled = false;
          return;
        }

        setToken(data.token);
        showAlert('Account created successfully! Welcome to Vet Learn Hub...', 'success');
        setTimeout(() => {
          window.location.href = '/student/dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert('Network error during registration.', 'error');
        submitBtn.disabled = false;
      }
    });

    function showAlert(msg, type) {
      alertBox.classList.remove('hidden', 'bg-rose-500/20', 'text-rose-300', 'bg-teal-500/20', 'text-teal-300', 'bg-sky-500/20', 'text-sky-300');
      if (type === 'error') alertBox.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
      else if (type === 'success') alertBox.classList.add('bg-teal-500/20', 'text-teal-300', 'border', 'border-teal-500/30');
      else alertBox.classList.add('bg-sky-500/20', 'text-sky-300', 'border', 'border-sky-500/30');
      alertBox.textContent = msg;
    }

    function hideAlert() {
      alertBox.classList.add('hidden');
    }
  }

  // ==========================================
  // STUDENT DASHBOARD PAGE
  // ==========================================
  if (isDashboardPage) {
    if (!getToken()) {
      window.location.href = '/student/login.html';
      return;
    }

    const studentHeaderName = document.getElementById('studentHeaderName');
    const studentHeaderInstitute = document.getElementById('studentHeaderInstitute');
    const welcomeStudentName = document.getElementById('welcomeStudentName');
    const studentLogoutBtn = document.getElementById('studentLogoutBtn');

    // KPI & Stats
    const statTotalCases = document.getElementById('statTotalCases');
    const statBookmarked = document.getElementById('statBookmarked');
    const statCategoriesCount = document.getElementById('statCategoriesCount');
    const savedCasesBadge = document.getElementById('savedCasesBadge');

    // Tabs
    const tabAllCases = document.getElementById('tabAllCases');
    const tabSavedCases = document.getElementById('tabSavedCases');
    const tabPharmacology = document.getElementById('tabPharmacology');
    const tabCasesBtnHero = document.getElementById('tabCasesBtnHero');

    const allCasesSection = document.getElementById('allCasesSection');
    const savedCasesSection = document.getElementById('savedCasesSection');
    const pharmacologySection = document.getElementById('pharmacologySection');

    // Filter controls
    const studentSearchInput = document.getElementById('studentSearchInput');
    const studentCategoryFilter = document.getElementById('studentCategoryFilter');
    const studentCasesGrid = document.getElementById('studentCasesGrid');
    const savedCasesGrid = document.getElementById('savedCasesGrid');
    const casesLoading = document.getElementById('casesLoading');
    const casesEmpty = document.getElementById('casesEmpty');
    const savedEmpty = document.getElementById('savedEmpty');
    const medicationTableBody = document.getElementById('medicationTableBody');

    // Modal
    const studentCaseModal = document.getElementById('studentCaseModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalBtn2 = document.getElementById('closeModalBtn2');
    const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');

    let currentModalCaseId = null;
    let allLoadedCases = [];
    let debounceTimer = null;

    // Logout
    studentLogoutBtn.addEventListener('click', () => {
      removeToken();
      window.location.href = '/student/login.html';
    });

    // Check Student Profile
    async function checkStudentProfile() {
      try {
        const res = await fetch('/api/auth/student/me', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          removeToken();
          window.location.href = '/student/login.html';
          return;
        }
        const data = await res.json();
        if (data.user) {
          studentHeaderName.textContent = data.user.name;
          welcomeStudentName.textContent = data.user.name;
          studentHeaderInstitute.textContent = `${data.user.university || 'Veterinary Institute'} • ${data.user.semester || 'DVM Student'}`;
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      }
    }

    // Load Cases
    async function loadCases() {
      casesLoading.classList.remove('hidden');
      casesEmpty.classList.add('hidden');
      studentCasesGrid.innerHTML = '';

      try {
        const search = studentSearchInput.value.trim();
        const category = studentCategoryFilter.value;

        const params = new URLSearchParams();
        if (category !== 'all') params.append('category', category);
        if (search) params.append('search', search);

        const res = await fetch(`/api/student/cases?${params.toString()}`);
        const data = await res.json();

        casesLoading.classList.add('hidden');
        allLoadedCases = data.cases || data.treatments || [];

        statTotalCases.textContent = allLoadedCases.length;
        updateBookmarkStats();

        if (allLoadedCases.length === 0) {
          casesEmpty.classList.remove('hidden');
          return;
        }

        renderCases(allLoadedCases, studentCasesGrid);
        renderMedicationTable(allLoadedCases);
      } catch (err) {
        casesLoading.classList.add('hidden');
        console.error('Error loading cases:', err);
      }
    }

    // Load Meta
    async function loadMeta() {
      try {
        const res = await fetch('/api/student/meta');
        const data = await res.json();
        if (data && data.categoryCounts) {
          statCategoriesCount.textContent = Object.keys(data.categoryCounts).length;
        }
      } catch (err) {
        console.error('Error fetching meta:', err);
      }
    }

    function renderCases(cases, container) {
      const bookmarks = getBookmarks();
      container.innerHTML = cases.map(c => {
        const isBookmarked = bookmarks.includes(c.id);
        const coverImage = (c.images && c.images.length > 0) ? c.images[0].url : 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';
        const isDrive = (c.images && c.images.length > 0 && c.images[0].isDrive);

        return `
          <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
            
            <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
              <img src="${coverImage}" alt="${escapeHtml(c.caseTitle)}" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onerror="this.src='https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';">
              
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

              <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${getOutcomeBadgeClass(c.outcomeStatus)}">
                ${formatOutcomeStatus(c.outcomeStatus)}
              </span>

              <button onclick="window.handleCardBookmark('${c.id}')" title="${isBookmarked ? 'Remove Bookmark' : 'Save Case for Study'}"
                class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white flex items-center justify-center transition-all ${isBookmarked ? 'text-amber-400 font-bold' : 'text-slate-300'}">
                <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              </button>

              <span class="absolute bottom-3 left-3 text-xs font-semibold text-slate-200 bg-slate-900/70 px-2.5 py-1 rounded-md backdrop-blur-sm">
                <i class="fa-solid fa-paw text-teal-400 mr-1"></i> ${escapeHtml(c.animalSpecies)}
              </span>
            </div>

            <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md inline-block mb-2 border border-teal-100">
                  ${escapeHtml(c.category)}
                </span>

                <h3 class="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                  ${escapeHtml(c.caseTitle)}
                </h3>

                <p class="text-xs text-slate-600 mt-2 line-clamp-2 font-medium">
                  <strong class="text-slate-800">Diagnosis:</strong> ${escapeHtml(c.diagnosis)}
                </p>

                <p class="text-xs text-slate-500 mt-1 line-clamp-1">
                  <strong class="text-emerald-700">Rx:</strong> ${escapeHtml(c.medication)}
                </p>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="text-xs">
                  <p class="font-bold text-slate-800 flex items-center gap-1">
                    <i class="fa-solid fa-user-doctor text-emerald-600"></i> ${escapeHtml(c.doctorName)}
                  </p>
                  <p class="text-slate-400 text-[11px]">${escapeHtml(c.doctorClinic)}</p>
                </div>

                <button onclick="window.viewStudentCase('${c.id}')" 
                  class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5">
                  <i class="fa-solid fa-graduation-cap"></i> Study Case
                </button>
              </div>

            </div>

          </div>
        `;
      }).join('');
    }

    function renderMedicationTable(cases) {
      medicationTableBody.innerHTML = cases.map(c => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-4 py-3 font-semibold text-slate-800">${escapeHtml(c.animalSpecies)}</td>
          <td class="px-4 py-3 text-slate-700 font-medium">${escapeHtml(c.diagnosis)}</td>
          <td class="px-4 py-3 text-emerald-800 font-medium">${escapeHtml(c.medication)}</td>
          <td class="px-4 py-3">
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${getOutcomeBadgeClass(c.outcomeStatus)}">
              ${formatOutcomeStatus(c.outcomeStatus)}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button onclick="window.viewStudentCase('${c.id}')" class="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-lg text-xs font-bold transition-all">
              Inspect Case
            </button>
          </td>
        </tr>
      `).join('');
    }

    function updateBookmarkStats() {
      const bookmarks = getBookmarks();
      statBookmarked.textContent = bookmarks.length;
      savedCasesBadge.textContent = bookmarks.length;
    }

    window.handleCardBookmark = (caseId) => {
      toggleBookmark(caseId);
      updateBookmarkStats();
      renderCases(allLoadedCases, studentCasesGrid);
      loadSavedCases();
    };

    function loadSavedCases() {
      const bookmarks = getBookmarks();
      const savedList = allLoadedCases.filter(c => bookmarks.includes(c.id));

      if (savedList.length === 0) {
        savedEmpty.classList.remove('hidden');
        savedCasesGrid.classList.add('hidden');
      } else {
        savedEmpty.classList.add('hidden');
        savedCasesGrid.classList.remove('hidden');
        renderCases(savedList, savedCasesGrid);
      }
    }

    // Modal Case Viewer
    window.viewStudentCase = async (id) => {
      try {
        currentModalCaseId = id;
        const res = await fetch(`/api/student/cases/${id}`);
        const data = await res.json();
        const t = data.caseStudy || data.treatment;
        if (!t) return;

        document.getElementById('modalTitle').textContent = t.caseTitle;
        document.getElementById('modalCategoryBadge').textContent = t.category;
        document.getElementById('modalSpecies').textContent = t.animalSpecies;
        document.getElementById('modalDate').textContent = new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        document.getElementById('modalDoctorName').textContent = t.doctorName;
        document.getElementById('modalDoctorClinic').textContent = t.doctorClinic + (t.doctorSpecialization ? ` (${t.doctorSpecialization})` : '');
        document.getElementById('modalSymptoms').textContent = t.symptoms || 'No specific symptoms detailed.';
        document.getElementById('modalDiagnosis').textContent = t.diagnosis;
        document.getElementById('modalMedication').textContent = t.medication;

        const modalOutcomeBadge = document.getElementById('modalOutcomeBadge');
        modalOutcomeBadge.className = `px-2.5 py-1 rounded-md text-xs font-bold ${getOutcomeBadgeClass(t.outcomeStatus)}`;
        modalOutcomeBadge.textContent = formatOutcomeStatus(t.outcomeStatus);

        const bookmarks = getBookmarks();
        const isBookmarked = bookmarks.includes(id);
        modalBookmarkBtn.innerHTML = `<i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}`;

        const modalImagesGrid = document.getElementById('modalImagesGrid');
        if (t.images && t.images.length > 0) {
          modalImagesGrid.innerHTML = t.images.map(img => `
            <a href="${img.url}" target="_blank" class="block relative h-32 rounded-xl overflow-hidden border border-slate-200 group">
              <img src="${img.url}" alt="${escapeHtml(t.caseTitle)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                <i class="fa-solid fa-expand"></i> Expand
              </div>
            </a>
          `).join('');
        } else {
          modalImagesGrid.innerHTML = `<p class="text-xs text-slate-400 italic col-span-full">No clinical media attached to this record.</p>`;
        }

        studentCaseModal.classList.remove('hidden');
      } catch (err) {
        console.error('Error viewing student case:', err);
      }
    };

    modalBookmarkBtn.addEventListener('click', () => {
      if (!currentModalCaseId) return;
      const isNowBookmarked = toggleBookmark(currentModalCaseId);
      modalBookmarkBtn.innerHTML = `<i class="${isNowBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isNowBookmarked ? 'Bookmarked' : 'Bookmark'}`;
      updateBookmarkStats();
      renderCases(allLoadedCases, studentCasesGrid);
      loadSavedCases();
    });

    [closeModalBtn, closeModalBtn2].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          studentCaseModal.classList.add('hidden');
        });
      }
    });

    studentCaseModal.addEventListener('click', (e) => {
      if (e.target === studentCaseModal) {
        studentCaseModal.classList.add('hidden');
      }
    });

    // Tab Navigation
    tabAllCases.addEventListener('click', () => {
      setActiveTab(tabAllCases, allCasesSection);
    });

    tabSavedCases.addEventListener('click', () => {
      setActiveTab(tabSavedCases, savedCasesSection);
      loadSavedCases();
    });

    tabPharmacology.addEventListener('click', () => {
      setActiveTab(tabPharmacology, pharmacologySection);
    });

    if (tabCasesBtnHero) {
      tabCasesBtnHero.addEventListener('click', () => {
        setActiveTab(tabAllCases, allCasesSection);
        allCasesSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    function setActiveTab(btn, section) {
      [tabAllCases, tabSavedCases, tabPharmacology].forEach(b => {
        b.className = 'px-5 py-3 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 flex items-center gap-2';
      });
      btn.className = 'px-5 py-3 rounded-xl text-xs font-bold transition-all bg-teal-600 text-white shadow-sm flex items-center gap-2';

      [allCasesSection, savedCasesSection, pharmacologySection].forEach(s => s.classList.add('hidden'));
      section.classList.remove('hidden');
    }

    // Filters
    studentCategoryFilter.addEventListener('change', () => {
      loadCases();
    });

    studentSearchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadCases();
      }, 300);
    });

    function getOutcomeBadgeClass(status) {
      switch (status) {
        case 'recovered': return 'badge-recovered';
        case 'under_treatment': return 'badge-under_treatment';
        case 'chronic': return 'badge-chronic';
        case 'deceased': return 'badge-deceased';
        default: return 'badge-recovered';
      }
    }

    function formatOutcomeStatus(status) {
      switch (status) {
        case 'recovered': return 'Recovered';
        case 'under_treatment': return 'Under Treatment';
        case 'chronic': return 'Chronic Case';
        case 'deceased': return 'Deceased';
        default: return status;
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Initialize Dashboard
    checkStudentProfile();
    loadMeta();
    loadCases();
  }
});
