/* ==========================================================================
   Advay Adhyapak Photography Admin Controller - JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // DOM Elements
  const loginScreen = document.getElementById('login-screen');
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const loginForm = document.getElementById('login-form');
  const adminPasswordInput = document.getElementById('admin-password');
  const logoutBtn = document.getElementById('logout-btn');
  
  const bookingsTableBody = document.getElementById('bookings-table-body');
  const messagesTableBody = document.getElementById('messages-table-body');
  
  const searchInput = document.getElementById('dash-search');
  const statusFilterSelect = document.getElementById('dash-status-filter');
  
  const statTotalBookings = document.getElementById('stat-total-bookings');
  const statPendingBookings = document.getElementById('stat-pending-bookings');
  const statApprovedBookings = document.getElementById('stat-approved-bookings');
  const statMessages = document.getElementById('stat-messages');

  // In-memory caching
  let bookingsData = [];
  let contactsData = [];
  let token = sessionStorage.getItem('adminToken') || '';

  // --- Initialize Panel ---
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  // --- Auth handlers ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = adminPasswordInput.value;

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();

      if (result.success) {
        token = result.token;
        sessionStorage.setItem('adminToken', token);
        showToast('Authentication successful!', 'success');
        showDashboard();
      } else {
        showToast(result.message || 'Incorrect password.', 'error');
        adminPasswordInput.value = '';
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Failed to authenticate.', 'error');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    token = '';
    showToast('Logged out successfully.', 'info');
    showLogin();
  });

  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboardWrapper.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardWrapper.style.display = 'block';
    loadDashboardData();
  }


  // --- Load Data from APIs ---
  async function loadDashboardData() {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch bookings
      const bookingsRes = await fetch('/api/admin/bookings', { headers });
      const bookingsJson = await bookingsRes.json();
      
      // Fetch messages
      const contactsRes = await fetch('/api/admin/contacts', { headers });
      const contactsJson = await contactsRes.json();

      if (bookingsJson.success && contactsJson.success) {
        bookingsData = bookingsJson.bookings;
        contactsData = contactsJson.contacts;
        
        updateMetrics();
        renderTables();
      } else {
        showToast('Session expired. Please log in again.', 'error');
        showLogin();
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading server data.', 'error');
    }
  }


  // --- Metrics and Counters Update ---
  function updateMetrics() {
    statTotalBookings.textContent = bookingsData.length;
    statPendingBookings.textContent = bookingsData.filter(b => b.status === 'Pending').length;
    statApprovedBookings.textContent = bookingsData.filter(b => b.status === 'Approved').length;
    statMessages.textContent = contactsData.length;
  }


  // --- Render Tables ---
  function renderTables() {
    renderBookingsTable();
    renderMessagesTable();
  }

  function renderBookingsTable() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusFilter = statusFilterSelect.value;
    
    // Filter data
    const filtered = bookingsData.filter(booking => {
      const matchSearch = 
        booking.name.toLowerCase().includes(searchTerm) ||
        booking.email.toLowerCase().includes(searchTerm) ||
        booking.phone.toLowerCase().includes(searchTerm) ||
        booking.details.toLowerCase().includes(searchTerm);
        
      const matchStatus = statusFilter === 'all' || booking.status.toLowerCase() === statusFilter;
      
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">No bookings found matching filters.</td>
        </tr>
      `;
      return;
    }

    // Sort: newest first
    filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    bookingsTableBody.innerHTML = filtered.map(booking => {
      const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });

      // Actions availability
      let actionButtons = '';
      if (booking.status === 'Pending') {
        actionButtons += `
          <button class="btn-action approve-btn" onclick="updateBookingStatus('${booking.id}', 'Approved')" title="Approve Booking">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="btn-action delete-btn" onclick="updateBookingStatus('${booking.id}', 'Cancelled')" title="Cancel Booking">
            <i class="fa-solid fa-ban"></i>
          </button>
        `;
      } else if (booking.status === 'Approved') {
        actionButtons += `
          <button class="btn-action complete-btn" onclick="updateBookingStatus('${booking.id}', 'Completed')" title="Mark as Completed">
            <i class="fa-solid fa-square-check"></i>
          </button>
          <button class="btn-action delete-btn" onclick="updateBookingStatus('${booking.id}', 'Cancelled')" title="Cancel Booking">
            <i class="fa-solid fa-ban"></i>
          </button>
        `;
      }
      
      // Delete record permanently
      actionButtons += `
        <button class="btn-action delete-btn" onclick="deleteBookingRecord('${booking.id}')" title="Delete Booking Permanently">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;

      return `
        <tr>
          <td>
            <div class="client-name">${escapeHTML(booking.name)}</div>
            <div class="client-meta">
              <a href="mailto:${booking.email}"><i class="fa-regular fa-envelope"></i> ${escapeHTML(booking.email)}</a><br>
              <a href="tel:${booking.phone}"><i class="fa-solid fa-phone"></i> ${escapeHTML(booking.phone)}</a>
            </div>
          </td>
          <td><span class="shoot-cat">${escapeHTML(booking.category)}</span></td>
          <td><span class="shoot-date">${formattedDate}</span></td>
          <td><span class="badge-status ${booking.status.toLowerCase()}">${booking.status}</span></td>
          <td><div class="details-cell" title="${escapeHTML(booking.details)}">${escapeHTML(booking.details) || '<em class="text-muted">None</em>'}</div></td>
          <td>
            <div class="actions-cell">${actionButtons}</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderMessagesTable() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Filter messages
    const filtered = contactsData.filter(msg => {
      return (
        msg.name.toLowerCase().includes(searchTerm) ||
        msg.email.toLowerCase().includes(searchTerm) ||
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.message.toLowerCase().includes(searchTerm)
      );
    });

    if (filtered.length === 0) {
      messagesTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">No inquiry messages found matching filters.</td>
        </tr>
      `;
      return;
    }

    // Sort: newest first
    filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    messagesTableBody.innerHTML = filtered.map(msg => {
      const formattedDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <tr>
          <td>
            <div class="client-name">${escapeHTML(msg.name)}</div>
            <div class="client-meta"><i class="fa-regular fa-envelope"></i> ${escapeHTML(msg.email)}</div>
          </td>
          <td><strong>${escapeHTML(msg.subject)}</strong></td>
          <td><div class="message-body">${escapeHTML(msg.message)}</div></td>
          <td><span class="shoot-date">${formattedDate}</span></td>
          <td>
            <div class="actions-cell">
              <button class="btn-action delete-btn" onclick="deleteMessageRecord('${msg.id}')" title="Delete Message">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Escape HTML helper
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }


  // --- Event Listeners for Filters ---
  searchInput.addEventListener('input', renderTables);
  statusFilterSelect.addEventListener('change', renderTables);


  // --- Navigation Tabs ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });


  // --- API Actions ---

  // Update Booking Status
  window.updateBookingStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        loadDashboardData(); // Reload details
      } else {
        showToast(result.message || 'Action failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Failed to update status.', 'error');
    }
  };

  // Permanently Delete Booking
  window.deleteBookingRecord = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        showToast('Booking deleted.', 'success');
        loadDashboardData();
      } else {
        showToast(result.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Failed to delete booking.', 'error');
    }
  };

  // Delete Inquiry Message
  window.deleteMessageRecord = async (id) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        showToast('Message deleted.', 'success');
        loadDashboardData();
      } else {
        showToast(result.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Failed to delete message.', 'error');
    }
  };


  // --- Toast helper inside admin page ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    const autoClose = setTimeout(() => {
      dismissToast(toast);
    }, 4500);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoClose);
      dismissToast(toast);
    });
  }

  function dismissToast(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }

});
