// WASTE2WORTH Client-Side Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  // Toast container setup
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    
    toast.innerHTML = `
      <span class="material-icons-outlined toast-icon">${icon}</span>
      <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  const apiCall = async (url, options = {}) => {
    try {
      // Default headers for JSON (skip if FormData)
      if (!options.body || !(options.body instanceof FormData)) {
        options.headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };
      }
      
      options.credentials = options.credentials || 'include';
      const res = await fetch(url, options);
      
      // Attempt to parse JSON response
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // If not JSON, it might be a redirect page or plain text error
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'An error occurred');
        return text;
      }

      if (!res.ok) {
        // If authentication/authorization issues, redirect to login
        if (res.status === 401 || res.status === 403) {
          if (!options.ignoreAuthError) {
            showToast(data.error || 'Authentication required', 'error');
            setTimeout(() => { window.location.href = '/login'; }, 700);
          }
          throw new Error(data.error || 'Authentication required');
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ============================================================
  // SIDEBAR & NAVIGATION
  // ============================================================
  
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  // Highlight active nav item
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  // Password Visibility Toggle
  const togglePasswordBtn = document.getElementById('togglePassword');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      if (!passwordInput) return;
      const icon = togglePasswordBtn.querySelector('.material-icons-outlined');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (icon) icon.textContent = 'visibility_off';
      } else {
        passwordInput.type = 'password';
        if (icon) icon.textContent = 'visibility';
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('button[type="submit"]');
      const errBox = document.getElementById('authError');
      if (errBox) errBox.style.display = 'none';
      
      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Signing in...';
        
        const res = await apiCall('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          ignoreAuthError: true
        });
        
        showToast(res.message || 'Login successful', 'success');
        if (res.redirect) setTimeout(() => window.location.href = res.redirect, 800);
      } catch (err) {
        if (errBox) {
          const msgEl = document.getElementById('authErrorMessage');
          if (msgEl) msgEl.textContent = err.message || 'Invalid email or password';
          errBox.style.display = 'flex';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      const errBox = document.getElementById('authError');
      if (errBox) errBox.style.display = 'none';
      
      if (password.length < 6) {
        if (errBox) {
          const msgEl = document.getElementById('authErrorMessage');
          if (msgEl) msgEl.textContent = 'Password must be at least 6 characters';
          errBox.style.display = 'flex';
        }
        return showToast('Password must be at least 6 characters', 'error');
      }
      
      const btn = registerForm.querySelector('button[type="submit"]');
      
      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Creating account...';
        
        const res = await apiCall('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role }),
          ignoreAuthError: true
        });
        
        showToast(res.message || 'Registration successful', 'success');
        if (res.redirect) setTimeout(() => window.location.href = res.redirect, 800);
      } catch (err) {
        if (errBox) {
          const msgEl = document.getElementById('authErrorMessage');
          if (msgEl) msgEl.textContent = err.message || 'Registration failed';
          errBox.style.display = 'flex';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }

  // ── Logout (event delegation — works even if script loads after click) ──
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#logoutBtn');
    if (!btn) return;
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    window.location.href = '/login';
  });

  // ============================================================
  // USER INFO LOADING
  // ============================================================
  
  const loadUserInfo = async (isPublic = false) => {
    // Only load if elements exist on page
    if (!document.querySelector('.user-name') && !document.getElementById('headerUser')) return;
    
    try {
      const user = await apiCall('/api/auth/me', { ignoreAuthError: isPublic });
      
      // Reveal header user details if logged in
      const headerUser = document.getElementById('headerUser');
      if (headerUser) headerUser.style.display = 'flex';
      
      const authLink = document.getElementById('navAuthLink');
      if (authLink) {
        authLink.innerHTML = '<span class="material-icons-outlined">logout</span> Logout';
        authLink.id = 'logoutBtn'; // Picked up by document-level delegation
      }
      
      const dashboardLink = document.getElementById('navDashboardLink');
      if (dashboardLink) {
        let route = '/dashboard/citizen';
        if (user.role === 'BhangariShop') route = '/dashboard/bhangari';
        else if (user.role === 'Creator') route = '/dashboard/creator';
        else if (user.role === 'Admin') route = '/dashboard/admin';
        else if (user.role === 'Volunteer') route = '/volunteer/register';
        dashboardLink.href = route;
      }

      const creatorProfileLink = document.getElementById('navCreatorProfileLink');
      if (creatorProfileLink && user.role === 'Creator') {
        creatorProfileLink.href = `/creator-profile/${user.id}`;
        creatorProfileLink.style.display = 'flex';
      }
      
      document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
      document.querySelectorAll('.user-role').forEach(el => el.textContent = user.role);
      document.querySelectorAll('.green-points-value').forEach(el => el.textContent = user.greenPoints || 0);
      
      const avatarStr = user.name.substring(0, 2).toUpperCase();
      document.querySelectorAll('.user-avatar').forEach(el => el.textContent = avatarStr);
      
      const pointsStat = document.getElementById('statPoints');
      if (pointsStat) pointsStat.textContent = user.greenPoints || 0;
      
      // Fetch and render notifications
      try {
        const notifs = await apiCall('/api/notifications', { ignoreAuthError: true });
        if (notifs) {
          const unreadCount = notifs.filter(n => !n.isRead).length;
          
          let notifDropdown = document.getElementById('notifDropdown');
          if (!notifDropdown) {
            notifDropdown = document.createElement('div');
            notifDropdown.id = 'notifDropdown';
            notifDropdown.style.cssText = 'position:relative; margin-right: 15px; cursor: pointer; display: flex; align-items: center;';
            notifDropdown.innerHTML = `
              <span class="material-icons-outlined" style="font-size:24px; color: var(--color-text-secondary);">notifications</span>
              <span id="notifBadge" style="display:none; position:absolute; top:-5px; right:-5px; background:var(--color-accent-amber); color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span>
              <div id="notifList" style="display:none; position:absolute; top:35px; right:0; width:340px; background:white; box-shadow:var(--shadow-dropdown); border-radius:var(--radius-md); border:1px solid var(--color-border); z-index:100; max-height:420px; overflow-y:auto;">
              </div>
            `;
            if (headerUser) headerUser.insertBefore(notifDropdown, headerUser.firstChild);
            
            notifDropdown.addEventListener('click', async (e) => {
              const list = document.getElementById('notifList');
              if (list.style.display === 'none') {
                list.style.display = 'block';
                // Mark as read
                if (unreadCount > 0) {
                  await apiCall('/api/notifications/mark-read', { method: 'POST', ignoreAuthError: true });
                  document.getElementById('notifBadge').style.display = 'none';
                }
              } else {
                list.style.display = 'none';
              }
            });
            
            // Close dropdown if clicked outside
            document.addEventListener('click', (e) => {
              if (!notifDropdown.contains(e.target)) {
                document.getElementById('notifList').style.display = 'none';
              }
            });
          }
          
          const badge = document.getElementById('notifBadge');
          if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
          } else {
            badge.style.display = 'none';
          }
          
          const list = document.getElementById('notifList');
          if (notifs.length === 0) {
            list.innerHTML = '<div style="padding:15px; text-align:center; color:var(--color-text-muted); font-size:0.9rem;">No notifications</div>';
          } else {
            list.innerHTML = notifs.map(n => {
              // ── Parse & highlight dollar amounts in the message ──────────
              const rawMsg    = n.message || '';
              const formatted = escapeHTML(rawMsg).replace(
                /\$(\d+(?:\.\d{1,2})?)/g,
                (_, amt) => `<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;font-weight:700;padding:1px 7px;border-radius:10px;font-size:0.85em;">$${amt}</span>`
              );
              // ── Pick icon based on message keywords ──────────────────────
              const msgLower  = rawMsg.toLowerCase();
              let notifIcon   = 'notifications';
              if (msgLower.includes('payment') || msgLower.includes('paid') || msgLower.includes('purchase') || msgLower.includes('sold')) notifIcon = 'payments';
              else if (msgLower.includes('green point') || msgLower.includes('+15') || msgLower.includes('+10')) notifIcon = 'eco';
              else if (msgLower.includes('campaign') || msgLower.includes('fund')) notifIcon = 'campaign';
              else if (msgLower.includes('scrap') || msgLower.includes('waste')) notifIcon = 'recycling';
              const iconColor = !n.isRead ? 'var(--color-primary)' : 'var(--color-text-muted)';
              const iconBg    = !n.isRead ? 'var(--color-primary-bg)' : '#f1f5f9';
              return `
              <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-bottom:1px solid var(--color-border-light);background:${!n.isRead ? 'rgba(46,125,50,0.04)' : 'transparent'};transition:background 0.2s;">
                <div style="width:34px;height:34px;border-radius:50%;background:${iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
                  <span class="material-icons-outlined" style="font-size:17px;">${notifIcon}</span>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.85rem;color:var(--color-text-primary);line-height:1.45;word-break:break-word;">${formatted}</div>
                  <div style="display:flex;align-items:center;gap:6px;margin-top:5px;">
                    <span style="font-size:0.72rem;color:var(--color-text-muted);">${formatDate(n.createdAt)}</span>
                    ${!n.isRead ? '<span style="width:6px;height:6px;border-radius:50%;background:var(--color-primary);display:inline-block;"></span>' : ''}
                  </div>
                </div>
              </div>`;
            }).join('');
          }
        }
      } catch (err) {
        console.warn("Could not load notifications", err);
      }
      
    } catch (err) {
      console.warn("User not logged in or failed to load user info:", err.message);
    }
  };

  // Automatically attempt loading logged-in user profile & nav header state
  loadUserInfo(true);

  // Profile Upgrade Helper
  window.upgradeRole = async (newRole) => {
    if (!confirm(`Are you sure you want to apply/upgrade to ${newRole}?`)) return;
    try {
      const res = await apiCall('/api/auth/role', {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast(res.message, 'success');
      if (res.redirect) {
        setTimeout(() => window.location.href = res.redirect, 1000);
      } else {
        loadUserInfo();
      }
    } catch (err) {
      // Error handled by apiCall
    }
  };

  // Setup photo preview helper
  const setupPhotoPreview = (inputId, previewId, zoneId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(zoneId);
    
    if (!input || !preview) return;
    
    // Click zone to trigger input
    if (zone) {
      zone.addEventListener('click', () => input.click());
      
      // Drag & Drop
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('active');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('active'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('active');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          input.files = e.dataTransfer.files;
          const event = new Event('change');
          input.dispatchEvent(event);
        }
      });
    }

    input.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          let img = preview.querySelector('img');
          if (!img) {
            img = document.createElement('img');
            preview.appendChild(img);
          }
          img.src = e.target.result;
          preview.classList.add('has-image');
        }
        reader.readAsDataURL(this.files[0]);
      }
    });
  };

  // ============================================================
  // CITIZEN: SCRAP LISTING
  // ============================================================
  
  if (currentPath.includes('/citizen')) {
    setupPhotoPreview('scrapPhoto', 'photoPreview', 'uploadZone');
    
    const scrapForm = document.getElementById('scrapForm');
    if (scrapForm) {
      scrapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(scrapForm);
        const btn = scrapForm.querySelector('button[type="submit"]');
        
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Submitting...';
          
          await apiCall('/api/scrap', {
            method: 'POST',
            body: formData // Let fetch set boundary for multipart
          });
          
          showToast('Scrap listing created! +10 Green Points', 'success');
          scrapForm.reset();
          document.getElementById('photoPreview').classList.remove('has-image');
          
          // Reload lists & user info (points update)
          loadMyListings();
          loadUserInfo();
        } catch (err) {
          // Handled
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">add_circle</span> Submit Listing';
        }
      });
    }

    const loadMyListings = async () => {
      const container = document.getElementById('myListings');
      const statTotal = document.getElementById('statTotal');
      const statActive = document.getElementById('statActive');
      
      if (!container) return;
      
      try {
        const listings = await apiCall('/api/scrap/my');
        
        if (statTotal) statTotal.textContent = listings.length;
        if (statActive) statActive.textContent = listings.filter(l => l.status === 'Available').length;
        
        if (listings.length === 0) {
          container.innerHTML = `
            <div class="empty-state animate-fade-in">
              <span class="material-icons-outlined empty-state-icon">inventory_2</span>
              <p class="empty-state-text">You haven't listed any scrap yet.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <div class="table-responsive animate-fade-in">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Listed On</th>
                </tr>
              </thead>
              <tbody>
                ${listings.map(item => `
                  <tr>
                    <td>
                      ${item.photoUrl 
                        ? `<img src="${item.photoUrl}" class="table-photo" alt="Scrap">` 
                        : `<div class="table-photo" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><span class="material-icons-outlined">image</span></div>`
                      }
                    </td>
                    <td style="font-weight:500;">${escapeHTML(item.category)}</td>
                    <td>${item.weight} kg</td>
                    <td><span class="status-pill" data-status="${item.status}">${item.status}</span></td>
                    <td style="color:var(--color-text-secondary);">${formatDate(item.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div class="form-error">Failed to load listings.</div>`;
      }
    };
    
    const loadPriceDirectory = async () => {
      const tbody = document.getElementById('citizenPriceDirectory');
      if (!tbody) return;
      try {
        const prices = await apiCall('/api/price-directory');
        tbody.innerHTML = prices.map(p => `
          <tr>
            <td style="font-weight: 600; color: var(--color-primary);">${escapeHTML(p.categoryName)}</td>
            <td style="font-weight: 500;">$${parseFloat(p.pricePerKg).toFixed(2)} / kg</td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center form-error">Failed to load price directory.</td></tr>`;
      }
    };
    
    // Initial loads
    loadUserInfo();
    loadMyListings();
    loadPriceDirectory();
  }

  // ============================================================
  // BHANGARI: BUYING BOARD
  // ============================================================
  
  if (currentPath.includes('/bhangari')) {
    let allBoardListings = [];
    let priceMap = {};

    const getCategoryRate = (category) => {
      if (!category) return 5.00;
      if (priceMap[category]) return priceMap[category];
      const matchKey = Object.keys(priceMap).find(k => k.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(k.toLowerCase()));
      return matchKey ? priceMap[matchKey] : 5.00;
    };

    // ── Reusable styled purchase-confirmation modal ──────────────────────────
    const CATEGORY_ICONS = {
      Plastic:  'water_drop',
      Metal:    'hardware',
      Paper:    'description',
      Glass:    'local_bar',
      'E-Waste':'memory',
      Textile:  'dry_cleaning',
      Default:  'inventory_2'
    };

    /**
     * Shows a polished purchase-confirmation modal.
     * @param {object} opts
     *   opts.icon        - Material icon name
     *   opts.title       - Modal heading
     *   opts.badge       - Category label shown in a coloured badge
     *   opts.rows        - Array of { label, value, highlight? } for the breakdown table
     *   opts.total       - Formatted total string (e.g. "$21.00")
     *   opts.onConfirm   - Async fn called when user clicks "Confirm & Pay"
     */
    const showPurchaseModal = (opts) => {
      const existing = document.getElementById('w2w-purchase-modal');
      if (existing) existing.remove();

      const icon  = opts.icon  || 'payment';
      const rows  = (opts.rows || []).map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-border-light);">
          <span style="font-size:0.85rem;color:var(--color-text-secondary);">${escapeHTML(r.label)}</span>
          <span style="font-size:0.9rem;font-weight:${r.highlight ? '700' : '500'};color:${r.highlight ? 'var(--color-primary)' : 'var(--color-text-primary)'};">${escapeHTML(String(r.value))}</span>
        </div>`).join('');

      const overlay = document.createElement('div');
      overlay.id = 'w2w-purchase-modal';
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
        z-index:9999;display:flex;align-items:center;justify-content:center;
        animation:fadeIn 200ms ease;
      `;

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:var(--radius-lg);padding:28px 32px;max-width:440px;width:90%;
                    box-shadow:0 24px 64px rgba(0,0,0,0.22);animation:slideUp 250ms ease;font-family:inherit;">

          <!-- Header -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-circle);background:var(--color-primary-bg);
                        color:var(--color-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-icons-outlined" style="font-size:24px;">${icon}</span>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.1rem;color:var(--color-text-primary);line-height:1.2;">${escapeHTML(opts.title || 'Confirm Purchase')}</div>
              <div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:2px;">Review transaction details below</div>
            </div>
          </div>

          <!-- Category badge -->
          ${opts.badge ? `
          <div style="margin-bottom:16px;">
            <span style="display:inline-flex;align-items:center;gap:6px;background:var(--color-primary-bg);
                         color:var(--color-primary);font-size:0.8rem;font-weight:600;
                         padding:4px 12px;border-radius:var(--radius-pill);">
              <span class="material-icons-outlined" style="font-size:14px;">${icon}</span>
              ${escapeHTML(opts.badge)}
            </span>
          </div>` : ''}

          <!-- Breakdown rows -->
          <div style="background:var(--color-border-light);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:20px;">
            ${rows}
            <!-- Total -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:4px;">
              <span style="font-size:0.9rem;font-weight:600;color:var(--color-text-primary);">Total Amount</span>
              <span style="font-size:1.4rem;font-weight:800;color:var(--color-primary);">${escapeHTML(opts.total || '$0.00')}</span>
            </div>
          </div>

          <!-- Green Points incentive -->
          <p style="font-size:0.82rem;color:var(--color-text-secondary);margin:0 0 20px;display:flex;align-items:center;gap:6px;">
            <span class="material-icons-outlined" style="font-size:16px;color:#4caf50;">eco</span>
            This purchase awards you <strong style="color:var(--color-primary);margin:0 3px;">+15 Green Points</strong> and rewards the seller.
          </p>

          <!-- Actions -->
          <div style="display:flex;gap:10px;">
            <button id="w2w-modal-confirm" class="btn btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;">
              <span class="material-icons-outlined" style="font-size:18px;">payment</span> Confirm &amp; Pay
            </button>
            <button id="w2w-modal-cancel" class="btn btn-ghost" style="flex:1;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Close handlers
      document.getElementById('w2w-modal-cancel').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

      // Confirm handler — returns a Promise that resolves true/false
      return new Promise((resolve) => {
        document.getElementById('w2w-modal-confirm').addEventListener('click', async () => {
          const confirmBtn = document.getElementById('w2w-modal-confirm');
          confirmBtn.disabled = true;
          confirmBtn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Processing...';
          overlay.remove();
          resolve(true);
        });
        document.getElementById('w2w-modal-cancel').addEventListener('click', () => resolve(false), { once: true });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) resolve(false); }, { once: true });
      });
    };
    // ────────────────────────────────────────────────────────────────────────

    window.purchaseScrap = async (listingId, category, weight, sellerName) => {
      const rate     = getCategoryRate(category);
      const estTotal = (weight * rate).toFixed(2);

      const confirmed = await showPurchaseModal({
        icon:   CATEGORY_ICONS[category] || CATEGORY_ICONS.Default,
        title:  'Confirm Scrap Purchase',
        badge:  category,
        rows: [
          { label: 'Seller',          value: sellerName },
          { label: 'Weight',          value: `${weight} kg` },
          { label: 'Benchmark Rate',  value: `$${parseFloat(rate).toFixed(2)} / kg` },
        ],
        total:  `$${estTotal}`,
      });
      if (!confirmed) return;

      try {
        const res = await apiCall(`/api/bhangari/purchase/${listingId}`, { method: 'POST' });
        showToast(res.message || 'Purchase successful! +15 Green Points', 'success');
        loadBhangariBoard();
        loadUserInfo();
      } catch (err) {
        // Handled by apiCall
      }
    };

    const renderBoardTable = (data) => {
      const tbody = document.getElementById('bhangariBoard');
      if (!tbody) return;
      
      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:var(--color-text-muted);">No listings found for this category.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = data.map(item => {
        const rate = getCategoryRate(item.category);
        const estPrice = (parseFloat(item.weight) * rate).toFixed(2);
        return `
        <tr class="animate-fade-in">
          <td>
            ${item.photoUrl 
              ? `<img src="${item.photoUrl}" class="table-photo" alt="Scrap">` 
              : `<div class="table-photo" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><span class="material-icons-outlined">image</span></div>`
            }
          </td>
          <td>
            <div style="font-weight:500;">${escapeHTML(item.ownerName)}</div>
          </td>
          <td>${escapeHTML(item.category)}</td>
          <td style="font-weight:600;color:var(--color-primary);">${item.weight} kg</td>
          <td style="font-weight:700;color:var(--color-primary);">$${estPrice} <span style="font-size:0.75rem;font-weight:normal;color:var(--color-text-muted);">($${rate.toFixed(2)}/kg)</span></td>
          <td><span class="status-pill" data-status="${item.status}">${item.status}</span></td>
          <td style="color:var(--color-text-secondary);">${formatDate(item.createdAt)}</td>
          <td>
            ${item.status === 'Available' 
              ? `<button class="btn btn-primary btn-sm" onclick="purchaseScrap(${item.listingId}, '${escapeHTML(item.category).replace(/'/g, "\\'")}', ${item.weight}, '${escapeHTML(item.ownerName).replace(/'/g, "\\'")}')">Buy Now</button>`
              : `<button class="btn btn-ghost btn-sm" disabled>Sold Out</button>`
            }
          </td>
        </tr>
      `}).join('');
    };

    const loadBhangariBoard = async () => {
      try {
        allBoardListings = await apiCall('/api/bhangari/board');
        
        // Update stats
        const statAvail = document.getElementById('statAvailable');
        const statPurch = document.getElementById('statPurchased');
        if (statAvail) statAvail.textContent = allBoardListings.filter(l => l.status === 'Available').length;
        if (statPurch) statPurch.textContent = allBoardListings.filter(l => l.status === 'Sold').length;
        
        // Setup initial render
        const activeChip = document.querySelector('.chip.active');
        const activeCat = activeChip ? activeChip.dataset.cat : 'All';
        filterBoard(activeCat);
        
      } catch (err) {
        const tbody = document.getElementById('bhangariBoard');
        if(tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center form-error">Failed to load board data.</td></tr>`;
      }
    };

    const filterBoard = (category) => {
      if (category === 'All') {
        renderBoardTable(allBoardListings);
      } else {
        renderBoardTable(allBoardListings.filter(l => l.category === category));
      }
    };

    // Chip click listeners
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterBoard(chip.dataset.cat);
      });
    });

    window.purchaseVolunteerWaste = async (registrationId, weight, campaignTitle, volunteerName) => {
      // Step 1 — category picker inline modal
      const existing = document.getElementById('w2w-purchase-modal');
      if (existing) existing.remove();

      const CATEGORIES = ['Plastic', 'Metal', 'Paper', 'Glass', 'E-Waste', 'Textile'];

      const categoryChips = CATEGORIES.map(cat => `
        <button type="button" class="w2w-cat-chip" data-cat="${cat}"
          style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-pill);
                 border:2px solid var(--color-border);background:#fff;cursor:pointer;font-size:0.82rem;
                 font-weight:500;color:var(--color-text-secondary);transition:all 0.15s;">
          <span class="material-icons-outlined" style="font-size:14px;">${CATEGORY_ICONS[cat] || 'inventory_2'}</span>${cat}
        </button>`).join('');

      const pickerOverlay = document.createElement('div');
      pickerOverlay.id = 'w2w-purchase-modal';
      pickerOverlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
        z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 200ms ease;`;
      pickerOverlay.innerHTML = `
        <div style="background:#fff;border-radius:var(--radius-lg);padding:28px 32px;max-width:440px;width:90%;
                    box-shadow:0 24px 64px rgba(0,0,0,0.22);animation:slideUp 250ms ease;font-family:inherit;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-circle);background:var(--color-primary-bg);
                        color:var(--color-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-icons-outlined" style="font-size:24px;">recycling</span>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.05rem;color:var(--color-text-primary);">Select Waste Category</div>
              <div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:2px;">${escapeHTML(campaignTitle || 'Campaign Waste')} — ${weight} kg by ${escapeHTML(volunteerName || 'Volunteer')}</div>
            </div>
          </div>
          <div id="w2w-cat-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;">${categoryChips}</div>
          <div style="display:flex;gap:10px;">
            <button id="w2w-cat-confirm" class="btn btn-primary" style="flex:1;" disabled>
              <span class="material-icons-outlined" style="font-size:18px;">arrow_forward</span> Next
            </button>
            <button id="w2w-cat-cancel" class="btn btn-ghost" style="flex:1;">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(pickerOverlay);

      // Chip toggle
      let selectedCategory = null;
      pickerOverlay.querySelectorAll('.w2w-cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          pickerOverlay.querySelectorAll('.w2w-cat-chip').forEach(c => {
            c.style.borderColor   = 'var(--color-border)';
            c.style.background    = '#fff';
            c.style.color         = 'var(--color-text-secondary)';
          });
          chip.style.borderColor = 'var(--color-primary)';
          chip.style.background  = 'var(--color-primary-bg)';
          chip.style.color       = 'var(--color-primary)';
          selectedCategory = chip.dataset.cat;
          document.getElementById('w2w-cat-confirm').disabled = false;
        });
      });

      document.getElementById('w2w-cat-cancel').addEventListener('click', () => pickerOverlay.remove());
      pickerOverlay.addEventListener('click', (e) => { if (e.target === pickerOverlay) pickerOverlay.remove(); });

      // Wait for category selection
      const category = await new Promise((resolve) => {
        document.getElementById('w2w-cat-confirm').addEventListener('click', () => {
          pickerOverlay.remove();
          resolve(selectedCategory);
        });
        document.getElementById('w2w-cat-cancel').addEventListener('click', () => resolve(null), { once: true });
        pickerOverlay.addEventListener('click', (e) => { if (e.target === pickerOverlay) resolve(null); }, { once: true });
      });
      if (!category) return;

      // Step 2 — confirmation modal
      const rate     = getCategoryRate(category);
      const estTotal = (weight * rate).toFixed(2);

      const confirmed = await showPurchaseModal({
        icon:  CATEGORY_ICONS[category] || CATEGORY_ICONS.Default,
        title: 'Confirm Campaign Waste Purchase',
        badge: `${category} — Campaign Waste`,
        rows: [
          { label: 'Campaign',         value: campaignTitle || '—' },
          { label: 'Volunteer',        value: volunteerName  || '—' },
          { label: 'Waste Weight',     value: `${weight} kg` },
          { label: 'Benchmark Rate',   value: `$${parseFloat(rate).toFixed(2)} / kg` },
        ],
        total: `$${estTotal}`,
      });
      if (!confirmed) return;

      try {
        const res = await apiCall(`/api/payments/purchase-campaign-waste/${registrationId}`, {
          method: 'POST',
          body: JSON.stringify({ category })
        });
        showToast(res.message || 'Purchase successful! Funds routed to campaign fund.', 'success');
        loadVolunteerWaste();
        loadCampaignFundBalance();
        loadUserInfo();
      } catch (err) {}
    };

    const loadCampaignFundBalance = async () => {
      const el = document.getElementById('statCampaignFund');
      if (!el) return;
      try {
        const data = await apiCall('/api/payments/campaign-fund');
        el.textContent = `$${data.balance}`;
      } catch (err) {}
    };

    const loadVolunteerWaste = async () => {
      const tbody = document.getElementById('volunteerWasteBoard');
      if (!tbody) return;
      
      try {
        const data = await apiCall('/api/payments/attended-registrations');
        const withWaste = data.filter(r => parseFloat(r.wasteCollectedKg) > 0);
        
        if (withWaste.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px;color:var(--color-text-muted);">No campaign waste available for purchase.</td></tr>`;
          return;
        }
        
        tbody.innerHTML = withWaste.map(item => `
          <tr class="animate-fade-in">
            <td><div style="font-weight:500;">${escapeHTML(item.campaignTitle)}</div></td>
            <td>${escapeHTML(item.volunteerName)}</td>
            <td style="font-weight:600;color:var(--color-primary);">${item.wasteCollectedKg} kg</td>
            <td><span class="status-pill" data-status="Available">Available</span></td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="purchaseVolunteerWaste(${item.registrationId}, ${item.wasteCollectedKg}, '${escapeHTML(item.campaignTitle).replace(/'/g, "\\'")}', '${escapeHTML(item.volunteerName).replace(/'/g, "\\'")}')">Buy Waste</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center form-error">Failed to load campaign waste data.</td></tr>`;
      }
    };

    const loadBhangariPriceDirectory = async () => {
      const tbody = document.getElementById('bhangariPriceDirectory');
      try {
        const prices = await apiCall('/api/price-directory');
        priceMap = {};
        prices.forEach(p => {
          priceMap[p.categoryName] = parseFloat(p.pricePerKg);
          if (p.displayCategory) priceMap[p.displayCategory] = parseFloat(p.pricePerKg);
        });
        if (tbody) {
          tbody.innerHTML = prices.map(p => `
            <tr>
              <td style="font-weight: 600; color: var(--color-primary);">${escapeHTML(p.categoryName)}</td>
              <td style="font-weight: 500;">$${parseFloat(p.pricePerKg).toFixed(2)} / kg</td>
            </tr>
          `).join('');
        }
        // Re-render board with updated prices if already loaded
        if (allBoardListings.length > 0) filterBoard(document.querySelector('.chip.active')?.dataset.cat || 'All');
      } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="2" class="text-center form-error">Failed to load price directory.</td></tr>`;
      }
    };

    loadUserInfo();
    loadBhangariPriceDirectory().then(() => {
      loadBhangariBoard();
    });
    loadVolunteerWaste();
    loadCampaignFundBalance();
  }

  // ============================================================
  // CREATOR: RAW MATERIALS & CRAFTS
  // ============================================================
  
  if (currentPath.includes('/creator')) {
    
    // Setup for raw materials view
    if (document.getElementById('rawMaterialsFeed')) {
      
      window.secureMaterial = async (listingId) => {
        try {
          await apiCall(`/api/creator/purchase/${listingId}`, { method: 'POST' });
          showToast('Material secured! +25 Green Points', 'success');
          loadRawMaterials();
          loadUserInfo();
        } catch (err) {}
      };

      const loadRawMaterials = async () => {
        const feed = document.getElementById('rawMaterialsFeed');
        const statAvail = document.getElementById('statAvailable');
        
        try {
          const listings = await apiCall('/api/creator/materials');
          
          if(statAvail) statAvail.textContent = listings.length;
          
          if(listings.length === 0) {
            feed.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No available raw materials right now.</div>`;
            return;
          }
          
          feed.innerHTML = listings.map(item => `
            <div class="product-card animate-fade-in">
              <img src="${item.photoUrl || '/api/placeholder/400/300'}" class="product-card-image" alt="Scrap">
              <div class="product-card-body">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                  <h3 class="product-card-title">${escapeHTML(item.category)}</h3>
                  <span class="inventory-badge" style="background:var(--color-primary-bg);color:var(--color-primary);">${item.weight} kg</span>
                </div>
                <div class="product-card-creator">Source: ${escapeHTML(item.ownerName)}</div>
                
                <div style="margin-top:auto; padding-top:16px;">
                  <button class="btn btn-outline btn-block" onclick="secureMaterial(${item.listingId})">Secure Material</button>
                </div>
              </div>
            </div>
          `).join('');
          
        } catch (err) {
          feed.innerHTML = `<div class="form-error">Failed to load materials.</div>`;
        }
      };
      
      loadRawMaterials();
    }
    
    // Setup for create craft form
    if (document.getElementById('craftForm')) {
      setupPhotoPreview('beforePhoto', 'beforePreview', 'beforeZone');
      setupPhotoPreview('afterPhoto', 'afterPreview', 'afterZone');
      
      const form = document.getElementById('craftForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Listing...';
          
          await apiCall('/api/crafts', {
            method: 'POST',
            body: formData
          });
          
          showToast('Upcycled craft listed successfully! +30 Points', 'success');
          form.reset();
          document.getElementById('beforePreview').classList.remove('has-image');
          document.getElementById('afterPreview').classList.remove('has-image');
          loadUserInfo();
        } catch (err) {
          // Handled
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">storefront</span> List Craft on Store';
        }
      });
    }

    loadUserInfo();
  }

  // ============================================================
  // STOREFRONT
  // ============================================================
  
  if (currentPath === '/storefront' || currentPath === '/storefront/') {
    
    const storefrontGrid = document.getElementById('storefrontGrid');
    let storefrontCrafts = [];

    window.buyCraft = async (craftId, title, price, creatorName) => {
      // Build a payment confirmation modal
      const existing = document.getElementById('paymentModal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'paymentModal';
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
        z-index:9999;display:flex;align-items:center;justify-content:center;
        animation:fadeIn 200ms ease;
      `;
      modal.innerHTML = `
        <div style="background:white;border-radius:16px;padding:32px;max-width:420px;width:90%;
                    box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 250ms ease;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--color-primary-bg);
                        color:var(--color-primary);display:flex;align-items:center;justify-content:center;">
              <span class="material-icons-outlined">shopping_bag</span>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.1rem;color:var(--color-text-primary);">Confirm Purchase</div>
              <div style="font-size:0.85rem;color:var(--color-text-secondary);">Secure checkout</div>
            </div>
          </div>
          <div style="background:var(--color-border-light);border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="font-weight:600;font-size:1rem;color:var(--color-text-primary);margin-bottom:4px;">${escapeHTML(title)}</div>
            <div style="color:var(--color-text-secondary);font-size:0.9rem;">By ${escapeHTML(creatorName)}</div>
            <div style="margin-top:12px;font-size:1.5rem;font-weight:800;color:var(--color-primary);">$${parseFloat(price).toFixed(2)}</div>
          </div>
          <p style="font-size:0.85rem;color:var(--color-text-secondary);margin-bottom:20px;">
            🌱 Your purchase directly supports this artisan and awards you <strong>+10 Green Points</strong>.
          </p>
          <div style="display:flex;gap:10px;">
            <button id="payConfirmBtn" class="btn btn-primary" style="flex:1;">
              <span class="material-icons-outlined">payment</span> Pay Now
            </button>
            <button id="payCancelBtn" class="btn btn-ghost" style="flex:1;">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Cancel
      document.getElementById('payCancelBtn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

      // Confirm pay
      document.getElementById('payConfirmBtn').addEventListener('click', async () => {
        const btn = document.getElementById('payConfirmBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Processing...';
        try {
          await apiCall(`/api/payments/checkout/${craftId}`, { method: 'POST' });
          modal.remove();
          showToast(`✅ Purchase successful! +10 Green Points earned.`, 'success');
          loadStorefront();
          loadUserInfo();
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">payment</span> Pay Now';
        }
      });
    };

    const renderStorefront = (items) => {
      if (!storefrontGrid) return;
      if (items.length === 0) {
        storefrontGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No crafts found for this category.</div>`;
        return;
      }

      storefrontGrid.innerHTML = items.map(item => `
        <div class="product-card animate-fade-in">
          <div style="position:relative; overflow:hidden;" class="craft-img-container">
            <img src="${item.afterPhotoUrl || '/api/placeholder/400/300'}" class="product-card-image" alt="${escapeHTML(item.title)}">
            ${item.beforePhotoUrl ? `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:10px; padding:2px 8px; border-radius:10px; text-transform:uppercase;">Upcycled</div>` : ''}
          </div>
          <div class="product-card-body">
            <h3 class="product-card-title">${escapeHTML(item.title)}</h3>
            <div class="product-card-creator">By <a href="/creator-profile/${item.creatorId}" class="creator-link" style="color: var(--color-primary); font-weight: 600; text-decoration: none;">${escapeHTML(item.creatorName)}</a></div>
            <div class="product-card-category" style="margin: 8px 0 0; color: var(--color-text-secondary); font-size: 0.95rem;">${escapeHTML(item.category || 'Uncategorized')}</div>
            <div class="product-card-desc" style="margin-top:10px;">
              ${escapeHTML(item.description || 'No description provided.')}
            </div>
            <div class="product-card-meta">
              <div class="product-card-price">$${item.price}</div>
              <div class="inventory-badge">${item.inventoryCount} in stock</div>
            </div>
            <div style="margin-top:16px;">
              ${item.inventoryCount > 0 
                ? `<button class="btn btn-primary btn-block btn-sm" onclick="buyCraft(${item.craftId}, '${escapeHTML(item.title).replace(/'/g,"\\'")}', ${item.price}, '${escapeHTML(item.creatorName).replace(/'/g,"\\'")}')">Buy Now</button>`
                : `<button class="btn btn-ghost btn-block btn-sm" disabled>Out of Stock</button>`
              }
            </div>
          </div>
        </div>
      `).join('');
    };

    const filterStorefront = (category) => {
      if (!category || category === 'All') {
        return renderStorefront(storefrontCrafts);
      }

      const filtered = storefrontCrafts.filter(item => item.category === category);
      renderStorefront(filtered);
    };

    const loadStorefront = async () => {
      if (!storefrontGrid) return;
      
      try {
        const crafts = await apiCall('/api/crafts');
        storefrontCrafts = crafts;
        
        if (crafts.length === 0) {
          storefrontGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No upcycled crafts available yet.</div>`;
          return;
        }
        
        filterStorefront('All');
      } catch (err) {
        storefrontGrid.innerHTML = `<div class="form-error">Failed to load storefront products.</div>`;
      }
    };

    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterStorefront(chip.dataset.cat || 'All');
      });
    });
    
    loadStorefront();
    loadUserInfo(true);
  }

  // ============================================================
  // CAMPAIGNS (ADMIN / VOLUNTEER)
  // ============================================================
  if (document.getElementById('campaignsFeed') || currentPath.includes('/campaigns') || currentPath.includes('/volunteer')) {
    const loadCampaigns = async () => {
      const feed = document.getElementById('campaignsFeed');
      if (!feed) return;
      try {
        const campaigns = await apiCall('/api/campaigns');
        if (campaigns.length === 0) {
          feed.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No upcoming campaigns.</div>`;
          return;
        }
        feed.innerHTML = campaigns.map(c => {
          const isOver = new Date(c.date) < new Date();
          const statusBadge = isOver ? '<span style="background-color:#d32f2f;color:white;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:bold;">OVER</span>' : '<span style="background-color:#2e7d32;color:white;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:bold;">ACTIVE</span>';
          const registerBtn = isOver ? '' : `<div style="margin-top:16px;">
                <button class="btn btn-outline btn-block" onclick="registerCampaign(${c.campaignId})">Register</button>
              </div>`;
          return `
          <div class="product-card animate-fade-in">
            <div class="product-card-body">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 class="product-card-title">${escapeHTML(c.title)}</h3>
                ${statusBadge}
              </div>
              <div class="product-card-creator"><strong>Campaign ID: #${c.campaignId}</strong></div>
              <div class="product-card-creator">Date: ${formatDate(c.date)}</div>
              <div class="product-card-desc">Zone: ${escapeHTML(c.boundaryZone)}</div>
              <div class="product-card-meta">
                <div>Volunteers: ${c.currentVolunteers}/${c.participantCap}</div>
              </div>
              ${registerBtn}
            </div>
          </div>
        `}).join('');
      } catch (err) {
        feed.innerHTML = `<div class="form-error">Failed to load campaigns.</div>`;
      }
    };

    window.registerCampaign = async (id) => {
      try {
        await apiCall(`/api/campaigns/${id}/register`, { method: 'POST' });
        showToast('Registered successfully!', 'success');
        loadCampaigns();
      } catch (err) {}
    };

    const mockScanBtn = document.getElementById('mockScanBtn');
    if (mockScanBtn) {
      mockScanBtn.addEventListener('click', async () => {
        const campaignId = prompt('Enter Campaign ID you are attending:');
        if (!campaignId) return;
        const wasteKg = prompt('Enter Waste Collected in KG (optional):', '0');
        
        // Need volunteer ID, but API will get it from req.user
        // So we just send campaignId and wasteCollectedKg
        const volunteerId = 999; // API uses req.user.id instead, so we just pass dummy if needed or API will handle.
        // Wait, campaign scan route expects volunteerId in body?
        // Let's pass it if needed, or rely on req.user.
        // Wait, the API requires volunteerId in body. Let's just fetch it from profile.
        const user = await apiCall('/api/auth/me');

        try {
          const res = await apiCall('/api/campaigns/scan', {
            method: 'POST',
            body: JSON.stringify({ campaignId: parseInt(campaignId), volunteerId: user.id, wasteCollectedKg: parseFloat(wasteKg) })
          });
          showToast(res.message, 'success');
          loadUserInfo();
        } catch(err) {}
      });
    }

    loadUserInfo();
    loadCampaigns();
  }

  // ============================================================
  // WASTE PORTAL (ADMIN)
  // ============================================================
  if (document.getElementById('wasteLogForm') || currentPath.includes('waste-portal')) {
    // 1. Tab Switching
    const tabBtns = document.querySelectorAll('.tab-nav .tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = document.getElementById('panel' + btn.dataset.tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // 2. Load drives into the dropdown
    const loadDrivesDropdown = async () => {
      const select = document.getElementById('wlDrive');
      if (!select) return;
      try {
        const drives = await apiCall('/api/drives');
        select.innerHTML = '<option value="">— No drive (ad-hoc collection) —</option>' + 
          drives.map(d => `<option value="${d.driveId}">${escapeHTML(d.title)} (${formatDate(d.date)})</option>`).join('');
      } catch (err) {}
    };

    // 3. Load My Logs
    const loadMyLogs = async () => {
      const container = document.getElementById('myLogsContainer');
      if (!container) return;
      try {
        const logs = await apiCall('/api/waste-logs');
        // Update stats
        if (document.getElementById('statMyLogs')) document.getElementById('statMyLogs').textContent = logs.length;
        const totalKg = logs.reduce((sum, l) => sum + parseFloat(l.weightKg || 0), 0);
        if (document.getElementById('statKg')) document.getElementById('statKg').textContent = totalKg.toFixed(1);
        const claimedCount = logs.filter(l => l.status === 'Claimed').length;
        if (document.getElementById('statClaimed')) document.getElementById('statClaimed').textContent = claimedCount;

        if (logs.length === 0) {
          container.innerHTML = '<div class="empty-state">No waste logs recorded yet.</div>';
          return;
        }
        container.innerHTML = logs.map(l => `
          <div class="log-card animate-fade-in">
            ${l.photoUrl ? `<img src="${l.photoUrl}" class="log-thumb">` : `<div class="log-thumb-placeholder"><span class="material-icons-outlined">image</span></div>`}
            <div class="log-info">
              <div class="log-title">${escapeHTML(l.category)} — ${l.weightKg} kg</div>
              <div class="log-meta">Logged on ${formatDate(l.collectedAt || l.createdAt)} ${(l.driveName || l.driveTitle) ? `| Drive: ${escapeHTML(l.driveName || l.driveTitle)}` : ''}</div>
              ${l.notes ? `<div style="font-size:12px;color:var(--color-text-secondary);">${escapeHTML(l.notes)}</div>` : ''}
            </div>
            <span class="status-pill" data-status="${l.status || 'Pending'}">${l.status || 'Pending'}</span>
          </div>
        `).join('');
      } catch (err) {
        container.innerHTML = '<div class="form-error">Failed to load waste logs.</div>';
      }
    };

    // 4. Load Upcoming/All Drives
    let allDrives = [];
    const renderDrives = (drives) => {
      const container = document.getElementById('drivesContainer');
      if (!container) return;
      if (drives.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="material-icons-outlined" style="font-size:48px;color:var(--color-text-muted);">directions_walk</span><p>No drives found for this filter.</p></div>';
        return;
      }
      container.innerHTML = drives.map(d => {
        const isUpcoming = d.status === 'Upcoming' || d.status === 'Active';
        const icon = isUpcoming ? 'event_available' : 'event';
        return `
          <div class="drive-card" style="position:relative;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:40px;height:40px;border-radius:50%;background:${isUpcoming ? 'var(--color-primary-bg)' : 'var(--color-bg-body)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span class="material-icons-outlined" style="font-size:20px;color:${isUpcoming ? 'var(--color-primary)' : 'var(--color-text-muted)'}">${icon}</span>
              </div>
              <div style="flex:1;min-width:0;">
                <div class="drive-card-title" style="margin-bottom:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(d.title)}</div>
                ${d.organizerName ? `<div style="font-size:11px;color:var(--color-text-muted);">by ${escapeHTML(d.organizerName)}</div>` : ''}
              </div>
              <span class="status-pill" data-status="${d.status}" style="flex-shrink:0;">${d.status}</span>
            </div>
            <div class="drive-card-meta">
              <span><span class="material-icons-outlined" style="font-size:14px;">place</span> ${escapeHTML(d.location || d.boundaryZone || 'Location TBA')}</span>
              <span><span class="material-icons-outlined" style="font-size:14px;">calendar_today</span> ${formatDate(d.date)}</span>
              ${d.participantCap ? `<span><span class="material-icons-outlined" style="font-size:14px;">group</span> Up to ${d.participantCap} participants</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    };

    const loadDrives = async () => {
      const container = document.getElementById('drivesContainer');
      if (!container) return;
      container.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;"><div class="spinner"></div></div>';
      try {
        allDrives = await apiCall('/api/drives');
        // Apply active filter
        const activeChip = document.querySelector('[data-drivefilter].active');
        const activeFilter = activeChip ? activeChip.dataset.drivefilter : 'all';
        applyDriveFilter(activeFilter);
      } catch (err) {
        container.innerHTML = '<div class="form-error" style="grid-column:1/-1;">Failed to load drives.</div>';
      }
    };

    const applyDriveFilter = (filter) => {
      let filtered = allDrives;
      if (filter === 'upcoming') {
        filtered = allDrives.filter(d => d.status === 'Upcoming' || d.status === 'Active');
      } else if (filter === 'past') {
        filtered = allDrives.filter(d => d.status === 'Completed');
      }
      renderDrives(filtered);
    };

    // Wire up drive filter chips
    document.querySelectorAll('[data-drivefilter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-drivefilter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyDriveFilter(chip.dataset.drivefilter);
      });
    });

    // 4b. Available Waste Marketplace
    let availableWasteLogs = [];
    const loadAvailableWaste = async () => {
      const container = document.getElementById('incomingRequestsContainer');
      if (!container) return;
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
      try {
        availableWasteLogs = await apiCall('/api/waste-logs');
        // Apply active filter
        const activeChip = document.querySelector('[data-wastefilter].active');
        const activeFilter = activeChip ? activeChip.dataset.wastefilter : 'available';
        applyWasteFilter(activeFilter);
      } catch (err) {
        container.innerHTML = '<div class="form-error">Failed to load waste listings.</div>';
      }
    };

    const applyWasteFilter = (filter) => {
      let filtered = availableWasteLogs;
      if (filter === 'available') {
        filtered = availableWasteLogs.filter(l => l.status !== 'Claimed');
      } else if (filter === 'claimed') {
        filtered = availableWasteLogs.filter(l => l.status === 'Claimed');
      }
      renderAvailableWaste(filtered);
    };

    const renderAvailableWaste = (logs) => {
      const container = document.getElementById('incomingRequestsContainer');
      if (!container) return;

      if (logs.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="padding:48px 0;">
            <span class="material-icons-outlined" style="font-size:52px;color:var(--color-text-muted);">storefront</span>
            <p style="margin-top:12px;color:var(--color-text-secondary);">No waste listed yet. Log some waste from the "Log Waste" tab to start showcasing.</p>
          </div>`;
        return;
      }

      const categoryEmojis = { Plastic:'♻️', Metal:'🔩', Paper:'📄', Glass:'🪟', 'E-Waste':'💻', Textile:'🧵', Organic:'🌿', Other:'📦' };
      const categoryColors = { Plastic:'#0ea5e9', Metal:'#6366f1', Paper:'#f59e0b', Glass:'#06b6d4', 'E-Waste':'#8b5cf6', Textile:'#ec4899', Organic:'#22c55e', Other:'#64748b' };

      container.innerHTML = `<div class="drive-grid">${logs.map(l => {
        const emoji = categoryEmojis[l.category] || '📦';
        const color = categoryColors[l.category] || '#64748b';
        const isClaimed = l.status === 'Claimed';
        const weight = parseFloat(l.weightKg || 0).toFixed(1);
        const estPrice = (parseFloat(l.weightKg || 0) * 45).toFixed(0);

        return `
          <div class="drive-card animate-fade-in" style="padding:0;overflow:hidden;${isClaimed ? 'opacity:0.65;' : ''}">
            <!-- Color header bar -->
            <div style="background:linear-gradient(135deg, ${color}22, ${color}11);padding:16px 20px;border-bottom:1px solid var(--color-border);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:28px;">${emoji}</span>
                <span class="status-pill" data-status="${isClaimed ? 'Claimed' : 'Pending'}">${isClaimed ? 'Claimed' : 'Available'}</span>
              </div>
              <div style="font-weight:700;font-size:18px;color:var(--color-text-primary);">${escapeHTML(l.category)}</div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">Logged on ${formatDate(l.collectedAt || l.createdAt)}</div>
            </div>

            <!-- Details -->
            <div style="padding:16px 20px;">
              <div style="display:flex;gap:16px;margin-bottom:12px;">
                <div style="flex:1;">
                  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Weight</div>
                  <div style="font-size:20px;font-weight:700;color:var(--color-primary);margin-top:2px;">${weight} kg</div>
                </div>
                <div style="flex:1;">
                  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);">Est. Value</div>
                  <div style="font-size:20px;font-weight:700;color:var(--color-text-primary);margin-top:2px;">৳${estPrice}</div>
                </div>
              </div>

              ${l.notes ? `<div style="font-size:12px;color:var(--color-text-secondary);padding:8px 12px;background:var(--color-bg-body);border-radius:var(--radius-sm);margin-bottom:12px;font-style:italic;">"${escapeHTML(l.notes)}"</div>` : ''}

              ${l.photoUrl ? `<img src="${l.photoUrl}" style="width:100%;height:120px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:12px;">` : ''}

              ${!isClaimed ? `<div style="padding:10px 12px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.06));border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);font-size:12px;color:#10b981;display:flex;align-items:center;gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">check_circle</span> Ready for pickup — visible to buyers
              </div>` : `<div style="padding:10px 12px;background:var(--color-bg-body);border-radius:var(--radius-sm);font-size:12px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">task_alt</span> Already claimed by a buyer
              </div>`}
            </div>
          </div>`;
      }).join('')}</div>`;
    };

    // Wire up waste filter chips
    document.querySelectorAll('[data-wastefilter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-wastefilter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyWasteFilter(chip.dataset.wastefilter);
      });
    });

    // 5. Submit waste log form
    const wasteForm = document.getElementById('wasteLogForm');
    if (wasteForm) {
      setupPhotoPreview('wastePhoto', 'wastePhotoPreview', 'wasteUploadZone');
      wasteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(wasteForm);
        const submitBtn = document.getElementById('wasteLogSubmitBtn');
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Submitting...';
          const res = await apiCall('/api/waste-logs', { method: 'POST', body: formData });
          showToast(res.message || 'Waste log submitted successfully!', 'success');
          wasteForm.reset();
          const preview = document.getElementById('wastePhotoPreview');
          if (preview) {
            preview.style.backgroundImage = 'none';
            preview.classList.remove('has-image');
          }
          // Refresh user info (Green Points balance) and lists!
          loadUserInfo();
          loadMyLogs();
        } catch (err) {
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="material-icons-outlined">add_circle</span> Submit Waste Log';
        }
      });
    }

    // 6. Submit cleanup drive form
    const driveForm = document.getElementById('driveForm');
    if (driveForm) {
      driveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('driveSubmitBtn');
        const title = document.getElementById('driveTitle').value;
        const location = document.getElementById('driveLocation').value;
        const date = document.getElementById('driveDate').value;
        const participantCap = document.getElementById('driveCap').value;
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Creating...';
          await apiCall('/api/drives', {
            method: 'POST',
            body: JSON.stringify({ title, location, date, participantCap })
          });
          showToast('Cleanup drive created successfully!', 'success');
          driveForm.reset();
          loadDrives();
          loadDrivesDropdown();
        } catch (err) {
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="material-icons-outlined">add_location</span> Create Drive';
        }
      });
    }

    // 7. Tab switch: load on demand
    document.querySelectorAll('.tab-nav .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === 'my-logs' || tab === 'log-waste') loadMyLogs();
        if (tab === 'incoming-requests') loadAvailableWaste();
        if (tab === 'drives') loadDrives();
      });
    });

    // Initialize all
    loadUserInfo();
    loadDrivesDropdown();
    loadMyLogs();
    loadDrives();
    loadAvailableWaste();
  }

  // ============================================================
  // CITIZEN: POLLUTION COMPLAINTS
  // ============================================================
  if (currentPath.includes('/citizen/pollution')) {
    setupPhotoPreview('scrapPhoto', 'photoPreview', 'uploadZone');
    
    const form = document.getElementById('pollutionForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        try {
          btn.disabled = true;
          btn.innerHTML = 'Submitting...';
          const res = await apiCall('/api/pollution', { method: 'POST', body: formData });
          showToast(res.message, 'success');
          form.reset();
          document.getElementById('photoPreview').classList.remove('has-image');
          loadReports();
          loadUserInfo();
        } catch (err) {} finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">send</span> Submit Report';
        }
      });
    }

    const loadReports = async () => {
      const tbody = document.getElementById('myPollutionReports');
      if (!tbody) return;
      try {
        const reports = await apiCall('/api/pollution/my');
        if (reports.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" class="text-center">No reports yet.</td></tr>`;
          return;
        }
        tbody.innerHTML = reports.map(r => `
          <tr>
            <td>${escapeHTML(r.locationPin)}</td>
            <td><span class="status-pill">${r.status}</span></td>
            <td>${formatDate(r.createdAt)}</td>
          </tr>
        `).join('');
      } catch (err) {}
    };

    loadUserInfo();
    loadReports();
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  if (document.getElementById('adminCampaignForm') || document.getElementById('priceDirectoryTbody') || currentPath === '/dashboard/admin') {
    const loadAdminDashboard = async () => {
      try {
        const data = await apiCall('/api/admin/dashboard');
        
        // Prices
        const pTbody = document.getElementById('priceDirectoryTbody');
        if (pTbody) {
          pTbody.innerHTML = data.prices.map(p => `
            <tr>
              <td>${escapeHTML(p.categoryName)}</td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px; padding:4px;" value="${p.pricePerKg}" id="price-${p.categoryId}"></td>
              <td><button class="btn btn-sm btn-primary" onclick="updatePrice(${p.categoryId})">Update</button></td>
            </tr>
          `).join('');
        }
        
        // Pollution
        const rTbody = document.getElementById('pollutionAdminTbody');
        if (rTbody) {
          if (data.complaints.length === 0) {
            rTbody.innerHTML = `<tr><td colspan="5" class="text-center">No reports loaded.</td></tr>`;
          } else {
            rTbody.innerHTML = data.complaints.map(c => `
              <tr>
                <td>${escapeHTML(c.citizenName)}</td>
                <td>${escapeHTML(c.locationPin)}</td>
                <td>${escapeHTML(c.description)}</td>
                <td><span class="status-pill">${c.status}</span></td>
                <td>${formatDate(c.createdAt)}</td>
              </tr>
            `).join('');
          }
        }
      } catch (err) {}
    };

    window.updatePrice = async (id) => {
      const val = document.getElementById(`price-${id}`).value;
      try {
        await apiCall(`/api/admin/prices/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ pricePerKg: val })
        });
        showToast('Price updated successfully');
      } catch (err) {}
    };

    const campaignForm = document.getElementById('adminCampaignForm');
    if (campaignForm) {
      campaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
          title: document.getElementById('campaignTitle').value,
          date: document.getElementById('campaignDate').value,
          participantCap: document.getElementById('campaignCap').value,
          boundaryZone: document.getElementById('campaignZone').value
        };
        try {
          await apiCall('/api/admin/campaigns', { method: 'POST', body: JSON.stringify(body) });
          showToast('Campaign launched successfully!', 'success');
          campaignForm.reset();
          loadAdminCampaigns();
        } catch (err) {}
      });
    }

    const loadAdminCampaigns = async () => {
      const feed = document.getElementById('adminCampaignsFeed');
      if (!feed) return;
      try {
        const campaigns = await apiCall('/api/campaigns');
        if (campaigns.length === 0) {
          feed.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No scheduled campaigns.</div>`;
          return;
        }
        feed.innerHTML = campaigns.map(c => {
          const isOver = new Date(c.date) < new Date();
          const statusBadge = isOver ? '<span style="background-color:#d32f2f;color:white;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:bold;">OVER</span>' : '<span style="background-color:#2e7d32;color:white;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:bold;">ACTIVE</span>';
          return `
          <div class="product-card animate-fade-in">
            <div class="product-card-body">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 class="product-card-title">${escapeHTML(c.title)}</h3>
                ${statusBadge}
              </div>
              <div class="product-card-creator"><strong>Campaign ID: #${c.campaignId}</strong></div>
              <div class="product-card-creator">Date: ${formatDate(c.date)}</div>
              <div class="product-card-desc">Zone: ${escapeHTML(c.boundaryZone)}</div>
              <div class="product-card-meta">
                <div>Volunteers: ${c.currentVolunteers}/${c.participantCap}</div>
              </div>
              <div style="margin-top:14px;">
                <a href="/dashboard/admin/campaign-qr?campaignId=${c.campaignId}" class="btn btn-primary-gradient btn-block btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;font-size:13px;border-radius:6px;">
                  <span class="material-icons-outlined" style="font-size:16px;">qr_code_2</span> Generate QR Code
                </a>
              </div>
            </div>
          </div>
        `}).join('');
      } catch (err) {
        feed.innerHTML = `<div class="form-error">Failed to load campaigns.</div>`;
      }
    };

    loadUserInfo();
    loadAdminDashboard();
    loadAdminCampaigns();
  }

  // Certificate Download Helper
  const downloadCertBtn = document.getElementById('downloadCertBtn');
  if (downloadCertBtn) {
    downloadCertBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('/api/rewards/certificate', '_blank');
    });
  }

  if (document.getElementById('productStoryForm') || currentPath.includes('product-story')) {

    const storyForm = document.getElementById('productStoryForm');
    if (storyForm) {
      storyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(storyForm);
        const btn = storyForm.querySelector('button[type="submit"]');
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Adding...';
          await apiCall('/api/crafts', {
            method: 'POST',
            body: formData
          });
          showToast('Product Story added successfully!', 'success');
          storyForm.reset();
          loadProductStories();
          loadUserInfo();
        } catch (err) {
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">add_circle</span> Add Product Story';
        }
      });
    }

    const loadProductStories = async () => {
      const grid = document.getElementById('storiesGrid');
      if (!grid) return;
      grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

      try {
        const crafts = await apiCall('/api/crafts');
        const filtered = crafts.filter(c => c.title);

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
              <span class="material-icons-outlined empty-state-icon">eco</span>
              <p class="empty-state-text">No product stories yet. Add one above!</p>
            </div>`;
          return;
        }

        grid.innerHTML = filtered.map(item => {
          const creator = item.creatorLabel || item.creatorName || null;
          const hasImpact = (item.unitsRecycled > 0 || parseFloat(item.wasteKgDiverted) > 0);

          return `
          <div class="story-card animate-fade-in" id="storyCard-${item.craftId}">

            <!-- Header -->
            <div class="story-card-header">
              <h3>🌱 ${escapeHTML(item.title)}</h3>
              <span class="story-card-badge">
                <span class="material-icons-outlined" style="font-size:12px;">sell</span>
                ৳${parseFloat(item.price).toFixed(2)}
              </span>
            </div>

            <!-- Photo -->
            ${item.afterPhotoUrl || item.beforePhotoUrl
              ? `<img class="story-card-img" src="${item.afterPhotoUrl || item.beforePhotoUrl}" alt="${escapeHTML(item.title)}">`
              : `<div class="story-card-img-placeholder"><span class="material-icons-outlined" style="font-size:48px;">image_not_supported</span></div>`
            }

            <!-- Details -->
            <div class="story-card-body">
              ${item.description ? `
              <div class="story-field">
                <span class="story-field-label">Description</span>
                <span class="story-field-value">${escapeHTML(item.description)}</span>
              </div>
              <div class="story-divider"></div>` : ''}

              ${item.origin ? `
              <div class="story-field">
                <span class="story-field-label">Origin</span>
                <span class="story-field-value">${escapeHTML(item.origin)}</span>
              </div>` : ''}

              ${item.materialsUsed ? `
              <div class="story-field">
                <span class="story-field-label">Materials Used</span>
                <span class="story-field-value">${escapeHTML(item.materialsUsed)}</span>
              </div>` : ''}

              ${creator ? `
              <div class="story-field">
                <span class="story-field-label">Created By</span>
                <span class="story-field-value" style="font-weight:600;color:var(--color-primary-dark);">${escapeHTML(creator)}</span>
              </div>` : ''}

              ${item.transformation || item.storyNarrative ? `
              <div class="story-divider"></div>
              <div class="story-field">
                <span class="story-field-label">Transformation</span>
                <span class="story-field-value" style="font-style:italic;">${escapeHTML(item.transformation || item.storyNarrative)}</span>
              </div>` : ''}

              ${hasImpact ? `
              <div class="story-divider"></div>
              <div class="story-field">
                <span class="story-field-label">Environmental Impact</span>
                <div class="story-impact-row" style="margin-top:4px;">
                  ${item.unitsRecycled > 0 ? `
                  <span class="story-impact-chip">
                    <span class="material-icons-outlined">recycling</span>
                    ${item.unitsRecycled} units recycled
                  </span>` : ''}
                  ${parseFloat(item.wasteKgDiverted) > 0 ? `
                  <span class="story-impact-chip">
                    <span class="material-icons-outlined">eco</span>
                    ${parseFloat(item.wasteKgDiverted).toFixed(1)} kg diverted
                  </span>` : ''}
                </div>
              </div>` : ''}
            </div>

            <!-- Customer Reviews -->
            <div class="story-reviews-box">
              <div class="story-reviews-header">
                <span>Customer Reviews</span>
                <span style="cursor:pointer;color:var(--color-primary);font-weight:600;font-size:0.75rem;text-transform:none;"
                      onclick="toggleReviewForm(${item.craftId})">Write Review</span>
              </div>
              <div id="reviewForm-${item.craftId}" style="display:none;margin-bottom:10px;padding:10px;background:var(--color-bg-card);border-radius:var(--radius-sm);border:1px solid var(--color-border);">
                <input id="reviewName-${item.craftId}" type="text" placeholder="Your name" class="form-input" style="margin-bottom:6px;font-size:13px;">
                <textarea id="reviewText-${item.craftId}" placeholder="Write your review..." class="form-textarea" rows="2" style="font-size:13px;margin-bottom:6px;min-height:56px;"></textarea>
                <div style="display:flex;gap:8px;align-items:center;">
                  <select id="reviewRating-${item.craftId}" class="form-select" style="font-size:13px;width:auto;">
                    <option value="">Rating (optional)</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 stars</option>
                    <option value="3">⭐⭐⭐ 3 stars</option>
                    <option value="2">⭐⭐ 2 stars</option>
                    <option value="1">⭐ 1 star</option>
                  </select>
                  <button class="btn btn-primary" style="font-size:12px;padding:6px 14px;" onclick="submitReview(${item.craftId})">Submit</button>
                </div>
              </div>
              <div id="reviewsList-${item.craftId}">
                <div class="loading-spinner" style="padding:6px 0;"><div class="spinner" style="width:18px;height:18px;"></div></div>
              </div>
            </div>

          </div>`;
        }).join('');

        // Load real reviews for every card
        filtered.forEach(item => loadReviews(item.craftId));

        // Update count badge
        const countEl = document.getElementById('storiesCount');
        if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

      } catch (err) {
        grid.innerHTML = `<div class="form-error">Failed to load product stories.</div>`;
      }
    };

    const loadReviews = async (craftId) => {
      const list = document.getElementById(`reviewsList-${craftId}`);
      if (!list) return;
      try {
        const res = await fetch(`/api/crafts/${craftId}/reviews`, { credentials: 'include' });
        if (!res.ok) { list.innerHTML = ''; return; }
        const reviews = await res.json();
        if (reviews.length === 0) {
          list.innerHTML = '<p style="font-size:12px;color:var(--color-text-muted);margin:4px 0;">No reviews yet. Be the first!</p>';
          return;
        }
        list.innerHTML = reviews.map(r => {
          const stars = r.rating ? '⭐'.repeat(r.rating) : '';
          return `
            <div class="story-review-item">
              <span class="story-review-user">${escapeHTML(r.reviewerName)}</span>
              ${stars ? `<span style="font-size:11px;">${stars}</span> ` : ''}
              <span>${escapeHTML(r.reviewText)}</span>
            </div>`;
        }).join('');
      } catch {
        list.innerHTML = '';
      }
    };

    window.toggleReviewForm = (craftId) => {
      const form = document.getElementById(`reviewForm-${craftId}`);
      if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
    };

    window.submitReview = async (craftId) => {
      const name   = document.getElementById(`reviewName-${craftId}`)?.value?.trim();
      const text   = document.getElementById(`reviewText-${craftId}`)?.value?.trim();
      const rating = document.getElementById(`reviewRating-${craftId}`)?.value || null;
      if (!name || !text) { showToast('Please enter your name and review.', 'error'); return; }
      try {
        await apiCall(`/api/crafts/${craftId}/reviews`, {
          method: 'POST',
          body: JSON.stringify({ reviewerName: name, reviewText: text, rating })
        });
        showToast('Review submitted!', 'success');
        // Reset & hide form, reload reviews
        document.getElementById(`reviewName-${craftId}`).value = '';
        document.getElementById(`reviewText-${craftId}`).value = '';
        document.getElementById(`reviewForm-${craftId}`).style.display = 'none';
        loadReviews(craftId);
      } catch { showToast('Failed to submit review.', 'error'); }
    };

    const searchInput = document.getElementById('storySearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.story-card').forEach(card => {
          card.style.display = card.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
        });
      });
    }

    loadUserInfo();
    loadProductStories();
  }

  // ============================================================
  // VOLUNTEER REGISTRATION PAGE
  // ============================================================
  const volunteerRegisterForm = document.getElementById('volunteerRegisterForm');
  if (volunteerRegisterForm) {
    // Check if already registered
    const checkExistingRegistration = async () => {
      try {
        await apiCall('/api/volunteers/me', { ignoreAuthError: true });
        // Profile exists — show banner, hide form
        const banner = document.getElementById('alreadyRegistered');
        if (banner) banner.style.display = 'flex';
        volunteerRegisterForm.style.display = 'none';
      } catch (err) {
        // 404 = not registered yet, show form normally
      }
    };
    checkExistingRegistration();

    volunteerRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('volunteerRegisterBtn');

      const fullName     = document.getElementById('vol-fullName').value.trim();
      const phone        = document.getElementById('vol-phone').value.trim();
      const address      = document.getElementById('vol-address').value.trim();
      const skills       = document.getElementById('vol-skills').value.trim();
      const experience   = document.getElementById('vol-experience').value.trim();
      const availability = document.querySelector('input[name="availability"]:checked')?.value || 'Flexible';
      const interestBoxes = document.querySelectorAll('input[name="interest"]:checked');
      const interests    = Array.from(interestBoxes).map(cb => cb.value).join(', ');

      if (!fullName || !phone || !address) {
        return showToast('Full name, phone, and address are required.', 'error');
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Registering…';

        await apiCall('/api/volunteers/register', {
          method: 'POST',
          body: JSON.stringify({ fullName, phone, address, skills, interests, availability, experience })
        });

        showToast('You are now registered as a volunteer! 🌿', 'success');
        setTimeout(() => { window.location.href = '/volunteer/profile'; }, 900);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">volunteer_activism</span> Register as Volunteer';
      }
    });

    loadUserInfo();
  }

  // ============================================================
  // VOLUNTEER PROFILE PAGE
  // ============================================================
  const profileSection   = document.getElementById('profileSection');
  const noProfileSection = document.getElementById('noProfileSection');
  const profileLoading   = document.getElementById('profileLoading');

  if (profileSection && noProfileSection) {
    const INTERESTS_LIST = [
      'Environmental Cleanup', 'Recycling', 'Community Outreach',
      'Education & Awareness', 'Waste Collection', 'Upcycling & Crafts',
      'Tree Planting', 'Social Media & Advocacy'
    ];
    const AVAIL_OPTIONS = ['Weekdays', 'Weekends', 'Both', 'Flexible'];

    let currentProfile = null;

    const renderEditInterests = (selected = '') => {
      const grid = document.getElementById('editInterestsGrid');
      if (!grid) return;
      const selectedArr = selected ? selected.split(',').map(s => s.trim()) : [];
      grid.innerHTML = INTERESTS_LIST.map((interest, i) => `
        <label class="edit-chip">
          <input type="checkbox" name="edit-interest" value="${interest}"
            ${selectedArr.includes(interest) ? 'checked' : ''}>
          ${interest}
        </label>
      `).join('');
    };

    const renderEditAvail = (current = 'Flexible') => {
      const row = document.getElementById('editAvailRow');
      if (!row) return;
      row.innerHTML = AVAIL_OPTIONS.map(opt => `
        <div class="edit-avail-opt">
          <input type="radio" name="edit-availability" id="ea-${opt}" value="${opt}"
            ${opt === current ? 'checked' : ''}>
          <label for="ea-${opt}">${opt}</label>
        </div>
      `).join('');
    };

    const renderProfile = async (p) => {
      currentProfile = p;

      // Hero section
      document.getElementById('heroAvatar').textContent = (p.fullName || '?').substring(0, 2).toUpperCase();
      document.getElementById('heroName').textContent     = p.fullName;
      document.getElementById('heroEmail').textContent    = p.userEmail || '';
      document.getElementById('heroPhone').textContent    = p.phone;
      document.getElementById('heroAvailability').textContent = p.availability;

      // Status pill
      const pill = document.getElementById('toggleStatusBtn');
      const label = document.getElementById('statusLabel');
      if (pill && label) {
        label.textContent = p.status;
        pill.className = `status-pill ${p.status === 'Active' ? 'active' : 'inactive'}`;
      }

      // Overview tab
      document.getElementById('infoFullName').textContent    = p.fullName;
      document.getElementById('infoPhone').textContent       = p.phone;
      document.getElementById('infoAddress').textContent     = p.address;
      document.getElementById('infoAvailability').textContent = p.availability;
      document.getElementById('infoCreatedAt').textContent   = formatDate(p.createdAt);
      document.getElementById('infoExperience').textContent  = p.experience || '—';

      const skillsEl = document.getElementById('infoSkills');
      if (p.skills) {
        skillsEl.innerHTML = p.skills.split(',').map(s => s.trim()).filter(Boolean)
          .map(s => `<span class="skill-tag">${escapeHTML(s)}</span>`).join('');
      } else {
        skillsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">No skills listed.</span>';
      }

      const interestsEl = document.getElementById('infoInterests');
      if (p.interests) {
        interestsEl.innerHTML = p.interests.split(',').map(s => s.trim()).filter(Boolean)
          .map(s => `<span class="interest-tag">${escapeHTML(s)}</span>`).join('');
      } else {
        interestsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">No interests selected.</span>';
      }

      // Load & Render Volunteer Medals
      const medalsEl = document.getElementById('infoMedals');
      if (medalsEl) {
        try {
          const medals = await apiCall('/api/medals/my', { ignoreAuthError: true });
          if (medals && medals.length > 0) {
            medalsEl.innerHTML = medals.map(m => `
              <div class="profile-medal-card">
                <span class="profile-medal-icon">${m.medalIcon}</span>
                <div>
                  <div class="profile-medal-title">${escapeHTML(m.medalName)}</div>
                  ${m.reason ? `<div class="profile-medal-reason">"${escapeHTML(m.reason)}"</div>` : ''}
                  <div class="profile-medal-meta">Awarded by ${escapeHTML(m.adminName)} &bull; ${formatDate(m.awardedAt)}</div>
                </div>
              </div>
            `).join('');
          } else {
            medalsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">No medals awarded yet.</span>';
          }
        } catch {
          medalsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">No medals awarded yet.</span>';
        }
      }

      // Populate edit tab fields
      document.getElementById('edit-fullName').value  = p.fullName;
      document.getElementById('edit-phone').value     = p.phone;
      document.getElementById('edit-address').value   = p.address;
      document.getElementById('edit-skills').value    = p.skills || '';
      document.getElementById('edit-experience').value = p.experience || '';
      renderEditInterests(p.interests);
      renderEditAvail(p.availability);

      profileLoading.style.display = 'none';
      profileSection.style.display = 'block';
    };

    const loadProfile = async () => {
      try {
        const p = await apiCall('/api/volunteers/me');
        renderProfile(p);
      } catch (err) {
        profileLoading.style.display = 'none';
        noProfileSection.style.display = 'block';
      }
    };

    // Tab switching
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(`tab-${tab.dataset.tab}`);
        if (target) target.classList.add('active');
      });
    });

    // Edit Profile button (hero) → switch to edit tab
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-tab="edit"]').classList.add('active');
        document.getElementById('tab-edit').classList.add('active');
      });
    }

    // Cancel edit
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-tab="overview"]').classList.add('active');
        document.getElementById('tab-overview').classList.add('active');
      });
    }

    // Save profile changes
    const volunteerEditForm = document.getElementById('volunteerEditForm');
    if (volunteerEditForm) {
      volunteerEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProfileBtn');

        const fullName     = document.getElementById('edit-fullName').value.trim();
        const phone        = document.getElementById('edit-phone').value.trim();
        const address      = document.getElementById('edit-address').value.trim();
        const skills       = document.getElementById('edit-skills').value.trim();
        const experience   = document.getElementById('edit-experience').value.trim();
        const availability = document.querySelector('input[name="edit-availability"]:checked')?.value || 'Flexible';
        const interestBoxes = document.querySelectorAll('input[name="edit-interest"]:checked');
        const interests    = Array.from(interestBoxes).map(cb => cb.value).join(', ');

        if (!fullName || !phone || !address) {
          return showToast('Full name, phone, and address are required.', 'error');
        }

        try {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Saving…';

          await apiCall('/api/volunteers/me', {
            method: 'PUT',
            body: JSON.stringify({ fullName, phone, address, skills, interests, availability, experience })
          });

          showToast('Profile updated successfully! 🌿', 'success');
          await loadProfile();

          // Switch back to overview
          document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
          document.querySelector('[data-tab="overview"]').classList.add('active');
          document.getElementById('tab-overview').classList.add('active');
        } catch (err) {
          // Error already shown by apiCall
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span class="material-icons-outlined">save</span> Save Changes';
        }
      });
    }

    // Toggle Active / Inactive status
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    if (toggleStatusBtn) {
      toggleStatusBtn.addEventListener('click', async () => {
        const newStatus = currentProfile?.status === 'Active' ? 'Inactive' : 'Active';
        const confirmed = confirm(`Set your volunteer status to "${newStatus}"?`);
        if (!confirmed) return;

        try {
          const res = await apiCall('/api/volunteers/me/status', { method: 'PATCH' });
          showToast(res.message, 'success');
          await loadProfile();
        } catch (err) {}
      });
    }

    loadUserInfo();
    loadProfile();
  }

  // ============================================================
  // ADMIN: VOLUNTEER MANAGEMENT PAGE
  // ============================================================
  const volunteersTbody = document.getElementById('volunteersTbody');
  const volunteerDetailModal = document.getElementById('volunteerDetailModal');

  if (volunteersTbody && volunteerDetailModal) {
    let allVolunteers = [];

    const renderBadge = (status) => status === 'Active'
      ? `<span class="badge-active"><span class="badge-dot"></span> Active</span>`
      : `<span class="badge-inactive"><span class="badge-dot"></span> Inactive</span>`;

    const renderTable = (list) => {
      if (list.length === 0) {
        volunteersTbody.innerHTML = `
          <tr><td colspan="8">
            <div class="empty-state">
              <span class="material-icons-outlined">search_off</span>
              No volunteers match the current filter.
            </div>
          </td></tr>`;
        return;
      }
      volunteersTbody.innerHTML = list.map((v, i) => `
        <tr class="vol-table-row" data-id="${v.id}" id="vol-row-${v.id}">
          <td>${i + 1}</td>
          <td style="font-weight:600;">${escapeHTML(v.fullName)}</td>
          <td style="color:var(--color-text-secondary);">${escapeHTML(v.userEmail || '')}</td>
          <td>${escapeHTML(v.phone)}</td>
          <td>${escapeHTML(v.availability)}</td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:200px;">
              ${v.skills ? v.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
                .map(s => `<span class="skill-tag" style="font-size:0.72rem;">${escapeHTML(s)}</span>`).join('') : '—'}
            </div>
          </td>
          <td>${renderBadge(v.status)}</td>
          <td style="color:var(--color-text-muted);">${formatDate(v.createdAt)}</td>
        </tr>
      `).join('');

      // Row click → open detail modal
      volunteersTbody.querySelectorAll('.vol-table-row').forEach(row => {
        row.addEventListener('click', () => openVolunteerDetail(row.dataset.id));
      });
    };

    const loadVolunteers = async (status = '') => {
      volunteersTbody.innerHTML = `<tr><td colspan="8" class="text-center"><div class="spinner"></div></td></tr>`;
      try {
        const url = status ? `/api/volunteers?status=${encodeURIComponent(status)}` : '/api/volunteers';
        const data = await apiCall(url);
        allVolunteers = data.volunteers || [];

        // Update stat cards
        const s = data.summary || {};
        document.getElementById('statTotal').textContent   = s.total   || 0;
        document.getElementById('statActive').textContent  = s.active  || 0;
        document.getElementById('statInactive').textContent = s.inactive || 0;

        applySearch();
      } catch (err) {
        volunteersTbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--color-accent-red);">Failed to load volunteers.</td></tr>`;
      }
    };

    const applySearch = () => {
      const query = (document.getElementById('volunteerSearch')?.value || '').toLowerCase();
      const filtered = allVolunteers.filter(v =>
        (v.fullName || '').toLowerCase().includes(query) ||
        (v.userEmail || '').toLowerCase().includes(query)
      );
      renderTable(filtered);
    };

    const openVolunteerDetail = async (id) => {
      try {
        const v = await apiCall(`/api/volunteers/${id}`);
        document.getElementById('modalTitle').textContent     = v.fullName;
        document.getElementById('modalFullName').textContent  = v.fullName;
        document.getElementById('modalUserName').textContent  = v.userName || '—';
        document.getElementById('modalEmail').textContent     = v.userEmail || '—';
        document.getElementById('modalPhone').textContent     = v.phone;
        document.getElementById('modalAddress').textContent   = v.address;
        document.getElementById('modalAvailability').textContent = v.availability;
        document.getElementById('modalCreatedAt').textContent = formatDate(v.createdAt);
        document.getElementById('modalUpdatedAt').textContent = formatDate(v.updatedAt);

        // Status badge
        const statusEl = document.getElementById('modalStatus');
        statusEl.innerHTML = v.status === 'Active'
          ? '<span class="badge-active"><span class="badge-dot"></span> Active</span>'
          : '<span class="badge-inactive"><span class="badge-dot"></span> Inactive</span>';

        // Skills
        const skillsEl = document.getElementById('modalSkills');
        if (v.skills) {
          skillsEl.innerHTML = v.skills.split(',').map(s => s.trim()).filter(Boolean)
            .map(s => `<span class="modal-skill-tag">${escapeHTML(s)}</span>`).join('');
        } else {
          skillsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">None listed.</span>';
        }

        // Interests
        const interestsEl = document.getElementById('modalInterests');
        if (v.interests) {
          interestsEl.innerHTML = v.interests.split(',').map(s => s.trim()).filter(Boolean)
            .map(s => `<span class="modal-interest-tag">${escapeHTML(s)}</span>`).join('');
        } else {
          interestsEl.innerHTML = '<span style="color:var(--color-text-muted); font-size:0.875rem;">None listed.</span>';
        }

        // Experience
        document.getElementById('modalExperience').textContent = v.experience || 'No experience information provided.';

        volunteerDetailModal.classList.add('open');
      } catch (err) {
        showToast('Failed to load volunteer details.', 'error');
      }
    };

    // Close modal
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      volunteerDetailModal.classList.remove('open');
    });
    volunteerDetailModal.addEventListener('click', (e) => {
      if (e.target === volunteerDetailModal) volunteerDetailModal.classList.remove('open');
    });

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => loadVolunteers(statusFilter.value));
    }

    // Search filter (client-side)
    const searchInput = document.getElementById('volunteerSearch');
    if (searchInput) {
      searchInput.addEventListener('input', applySearch);
    }

    loadUserInfo();
    loadVolunteers();
  }

});
