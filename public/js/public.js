document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusButtons = document.querySelectorAll('.status-btn');
  const casesGrid = document.getElementById('casesGrid');
  const casesLoading = document.getElementById('casesLoading');
  const noCasesFound = document.getElementById('noCasesFound');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  const statApproved = document.getElementById('statApproved');
  const statRecovered = document.getElementById('statRecovered');
  const statCategories = document.getElementById('statCategories');

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  let activeStatus = 'all';
  let activeCategory = 'all';
  let searchQuery = '';
  let debounceTimer = null;

  async function loadMetaStats() {
    try {
      const res = await fetch('/api/public/meta');
      const data = await res.json();
      if (data) {
        statApproved.textContent = data.totalApproved || 0;
        statRecovered.textContent = (data.statusCounts && data.statusCounts.recovered) || 0;
        statCategories.textContent = Object.keys(data.categoryCounts || {}).length || 0;
      }
    } catch (err) {
      console.error('Error loading meta stats:', err);
    }
  }

  async function loadCases() {
    casesLoading.classList.remove('hidden');
    casesGrid.innerHTML = '';
    noCasesFound.classList.add('hidden');

    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (activeStatus !== 'all') params.append('outcomeStatus', activeStatus);
      if (searchQuery.trim() !== '') params.append('search', searchQuery.trim());

      const res = await fetch(`/api/public/treatments?${params.toString()}`);
      const data = await res.json();

      casesLoading.classList.add('hidden');

      if (!data.treatments || data.treatments.length === 0) {
        noCasesFound.classList.remove('hidden');
        return;
      }

      renderCases(data.treatments);
    } catch (err) {
      console.error('Error fetching public cases:', err);
      casesLoading.classList.add('hidden');
      casesGrid.innerHTML = `
        <div class="col-span-full text-center py-10 text-rose-500 font-bold">
          Failed to load treatment cases. Please refresh the page.
        </div>
      `;
    }
  }

  function renderCases(cases) {
    casesGrid.innerHTML = cases.map(c => {
      const coverImage = (c.images && c.images.length > 0) ? c.images[0].url : 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';
      const isDrive = (c.images && c.images.length > 0 && c.images[0].isDrive);
      
      const outcomeBadgeClass = getOutcomeBadgeClass(c.outcomeStatus);
      const outcomeText = formatOutcomeStatus(c.outcomeStatus);

      return `
        <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
          
          <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
            <img src="${coverImage}" alt="${escapeHtml(c.caseTitle)}" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onerror="this.src='https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80';">
            
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

            <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${outcomeBadgeClass}">
              ${outcomeText}
            </span>

            ${isDrive ? `
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-teal-400 border border-teal-500/40 backdrop-blur-md flex items-center gap-1">
                <i class="fa-brands fa-google-drive"></i> Google Drive
              </span>
            ` : ''}

            <span class="absolute bottom-3 left-3 text-xs font-semibold text-slate-200 bg-slate-900/70 px-2.5 py-1 rounded-md backdrop-blur-sm">
              <i class="fa-solid fa-paw text-teal-400 mr-1"></i> ${escapeHtml(c.animalSpecies)}
            </span>
          </div>

          <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md inline-block mb-2 border border-teal-100">
                ${escapeHtml(c.category)}
              </span>

              <h3 class="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                ${escapeHtml(c.caseTitle)}
              </h3>

              <p class="text-xs text-slate-600 mt-2 line-clamp-2 font-medium">
                <strong class="text-slate-800">Diagnosis:</strong> ${escapeHtml(c.diagnosis)}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div class="text-xs">
                <p class="font-bold text-slate-800 flex items-center gap-1">
                  <i class="fa-solid fa-user-md text-emerald-600"></i> ${escapeHtml(c.doctorName)}
                </p>
                <p class="text-slate-400 text-[11px]">${escapeHtml(c.doctorClinic)}</p>
              </div>

              <button onclick="viewCaseDetail('${c.id}')" 
                class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5">
                View Case <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>

          </div>

        </div>
      `;
    }).join('');
  }

  categoryFilter.addEventListener('change', (e) => {
    activeCategory = e.target.value;
    loadCases();
  });

  statusButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      statusButtons.forEach(b => {
        b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        b.classList.add('text-slate-600');
      });
      btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
      btn.classList.remove('text-slate-600');

      activeStatus = btn.getAttribute('data-status');
      loadCases();
    });
  });

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value;
      loadCases();
    }, 300);
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      categoryFilter.value = 'all';
      searchQuery = '';
      activeCategory = 'all';
      activeStatus = 'all';

      statusButtons.forEach(b => {
        if (b.getAttribute('data-status') === 'all') {
          b.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
        } else {
          b.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        }
      });

      loadCases();
    });
  }

  window.viewCaseDetail = async (id) => {
    try {
      const res = await fetch(`/api/public/treatments/${id}`);
      const data = await res.json();
      if (!data.treatment) return;

      const t = data.treatment;
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

      document.getElementById('caseModal').classList.remove('hidden');
    } catch (err) {
      console.error('Error viewing case detail:', err);
    }
  };

  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalBtn2 = document.getElementById('closeModalBtn2');
  const caseModal = document.getElementById('caseModal');

  [closeModalBtn, closeModalBtn2].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        caseModal.classList.add('hidden');
      });
    }
  });

  caseModal.addEventListener('click', (e) => {
    if (e.target === caseModal) {
      caseModal.classList.add('hidden');
    }
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

  loadMetaStats();
  loadCases();
});
