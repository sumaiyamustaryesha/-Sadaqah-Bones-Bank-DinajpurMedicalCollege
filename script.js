// script.js - Sadaqah Bones Bank
// Complete functionality: Auth, Database (localStorage), Bone Donation/Request Forms, Admin Panel, Responsive UI

// ======================== DATABASE STRUCTURE ========================
let db = {
    users: [],
    boneRequests: [],      // receiving requests (students who want bones)
    boneDonations: [],     // donation offers (students who donate bones)
    inventory: { fullSets: 3, halfSets: 1, activeCycles: 2 },
    handovers: []
};

let currentUser = null;

// ======================== INITIALIZATION ========================
function initializeDatabase() {
    const stored = localStorage.getItem('sadaqah_bones_bank_db');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            db = { ...db, ...parsed };
            if (!db.boneDonations) db.boneDonations = [];
            if (!db.boneRequests) db.boneRequests = [];
            if (!db.handovers) db.handovers = [];
            if (!db.users) db.users = [];
            if (!db.inventory) db.inventory = { fullSets: 3, halfSets: 1, activeCycles: 2 };
        } catch(e) { console.error(e); }
    }
    
    // Create default admin if no users exist
    if (db.users.length === 0) {
        db.users.push({ email: "admin@sadaqah.com", password: "admin123", role: "admin" });
        // Add a demo student account for testing
        db.users.push({ email: "student@example.com", password: "student123", role: "student" });
    }
    
    // Add some sample handovers for demo if empty
    if (db.handovers.length === 0) {
        db.handovers = [
            { name: "Fatema Akter", batch: "MBBS 2023", type: "Full Set", date: "2026-01-15" },
            { name: "Nusrat Jahan", batch: "MBBS 2024", type: "Half Set", date: "2026-02-20" }
        ];
    }
    
    saveDatabase();
}

function saveDatabase() {
    const toStore = {
        users: db.users,
        boneRequests: db.boneRequests,
        boneDonations: db.boneDonations,
        inventory: db.inventory,
        handovers: db.handovers
    };
    localStorage.setItem('sadaqah_bones_bank_db', JSON.stringify(toStore));
}

// ======================== UI HELPER FUNCTIONS ========================
function showToast(message, isError = false) {
    // Remove any existing toast
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${isError ? '#dc2626' : '#2c6e5c'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 500;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        font-family: 'Lexend', sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Add animation style dynamically
if (!document.querySelector('#toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Close all modals
function closeAllModals() {
    const modals = ['applyModal', 'donateModal', 'loginModal', 'signupModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    });
}

function openModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

// ======================== AUTHENTICATION ========================
function renderAuthWidget() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;
    
    if (currentUser) {
        authSection.innerHTML = `
            <div class="user-greeting">
                <i class="fas fa-user-circle"></i>
                <span>${currentUser.email.split('@')[0]}</span>
                ${currentUser.role === 'admin' ? '<span style="background:#c9a03d; padding:2px 8px; border-radius:20px; font-size:10px;">Admin</span>' : ''}
                <button class="logout-btn" id="logoutBtn" style="background:none; border:none; color:#2c6e5c; cursor:pointer; margin-left:5px;">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                currentUser = null;
                renderAuthWidget();
                showToast('Logged out successfully');
                showPage('home');
                const adminNav = document.getElementById('adminNavBtn');
                if (adminNav) adminNav.style.display = 'none';
            });
        }
        
        const adminNav = document.getElementById('adminNavBtn');
        if (adminNav) {
            adminNav.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
        }
    } else {
        authSection.innerHTML = `
            <button class="auth-btn auth-btn-outline" id="loginNavBtn" style="background:transparent; border:1px solid #2c6e5c; color:#2c6e5c; padding:0.4rem 1rem; border-radius:40px; cursor:pointer; font-family:'Lexend',sans-serif; font-weight:500;">
                <i class="fas fa-key"></i> Login
            </button>
            <button class="auth-btn auth-btn-primary" id="signupNavBtn" style="background:#2c6e5c; color:white; border:none; padding:0.4rem 1rem; border-radius:40px; cursor:pointer; font-family:'Lexend',sans-serif; font-weight:500;">
                <i class="fas fa-user-plus"></i> Sign up
            </button>
        `;
        const loginBtn = document.getElementById('loginNavBtn');
        const signupBtn = document.getElementById('signupNavBtn');
        if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
        if (signupBtn) signupBtn.addEventListener('click', () => openModal('signupModal'));
        
        const adminNav = document.getElementById('adminNavBtn');
        if (adminNav) adminNav.style.display = 'none';
    }
}

function handleLogin(email, password) {
    if (!email || !password) {
        showToast('Please enter email and password', true);
        return false;
    }
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { email: user.email, role: user.role };
        renderAuthWidget();
        closeAllModals();
        showToast(`Welcome back, ${email.split('@')[0]}!`);
        showPage('home');
        return true;
    }
    showToast('Invalid email or password. Try: student@example.com / student123', true);
    return false;
}

function handleSignup(email, password) {
    if (!email || !password) {
        showToast('Please enter email and password', true);
        return false;
    }
    if (password.length < 4) {
        showToast('Password must be at least 4 characters', true);
        return false;
    }
    if (db.users.find(u => u.email === email)) {
        showToast('Email already registered', true);
        return false;
    }
    db.users.push({ email, password, role: 'student' });
    saveDatabase();
    currentUser = { email, role: 'student' };
    renderAuthWidget();
    closeAllModals();
    showToast('Account created successfully! You are now logged in.');
    showPage('home');
    return true;
}

// ======================== PAGE NAVIGATION ========================
function showPage(pageId) {
    const pages = ['home', 'about', 'documents', 'articles', 'contact', 'admin'];
    pages.forEach(id => {
        const page = document.getElementById(`${id}Page`);
        if (page) page.classList.remove('active-page');
    });
    
    const activePage = document.getElementById(`${pageId}Page`);
    if (activePage) activePage.classList.add('active-page');
    
    // Special handling for admin page
    if (pageId === 'admin') {
        if (!currentUser || currentUser.role !== 'admin') {
            showToast('Admin access only. Please login as admin.', true);
            showPage('home');
            return;
        }
        renderPendingRequests();
        refreshInventoryUI();
    }
    
    if (pageId === 'documents') {
        refreshInventoryUI();
        renderHandoverTable();
    }
}

// ======================== INVENTORY & HANDOVER ========================
function refreshInventoryUI() {
    const statsDiv = document.getElementById('inventoryStats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="stat-card"><i class="fas fa-box"></i> Full Sets: ${db.inventory.fullSets}</div>
            <div class="stat-card"><i class="fas fa-box-open"></i> Half Sets: ${db.inventory.halfSets}</div>
            <div class="stat-card"><i class="fas fa-sync-alt"></i> Active Cycles: ${db.inventory.activeCycles}</div>
        `;
    }
    
    const fullInput = document.getElementById('adminFullSets');
    const halfInput = document.getElementById('adminHalfSets');
    const activeInput = document.getElementById('adminActiveCycle');
    if (fullInput) fullInput.value = db.inventory.fullSets;
    if (halfInput) halfInput.value = db.inventory.halfSets;
    if (activeInput) activeInput.value = db.inventory.activeCycles;
}

function renderHandoverTable() {
    const tbody = document.getElementById('handoverTbody');
    if (!tbody) return;
    
    if (db.handovers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No handover records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = db.handovers.map(h => `
        <tr>
            <td><strong>${escapeHtml(h.name)}</strong></td>
            <td>${escapeHtml(h.batch)}</td>
            <td>${escapeHtml(h.type)}</td>
            <td><span style="background:#e8f3ef; padding:4px 12px; border-radius:20px;">Active</span></td>
            <td>${escapeHtml(h.date)}</td>
        </tr>
    `).join('');
}

function updateInventoryFromAdmin() {
    const full = parseInt(document.getElementById('adminFullSets').value);
    const half = parseInt(document.getElementById('adminHalfSets').value);
    const active = parseInt(document.getElementById('adminActiveCycle').value);
    
    if (!isNaN(full)) db.inventory.fullSets = full;
    if (!isNaN(half)) db.inventory.halfSets = half;
    if (!isNaN(active)) db.inventory.activeCycles = active;
    
    saveDatabase();
    refreshInventoryUI();
    showToast('Inventory updated successfully');
}

function addHandoverRecord() {
    const name = document.getElementById('handoverName').value.trim();
    const batch = document.getElementById('handoverBatch').value.trim();
    const type = document.getElementById('handoverType').value;
    
    if (!name || !batch) {
        showToast('Please fill name and batch', true);
        return;
    }
    
    db.handovers.unshift({
        name: name,
        batch: batch,
        type: type,
        date: new Date().toLocaleDateString('en-CA')
    });
    saveDatabase();
    renderHandoverTable();
    document.getElementById('handoverName').value = '';
    document.getElementById('handoverBatch').value = '';
    showToast('Handover record added');
}

// ======================== PENDING REQUESTS (ADMIN) ========================
function renderPendingRequests() {
    const container = document.getElementById('pendingRequestsList');
    if (!container) return;
    
    const pending = db.boneRequests.filter(r => r.status === 'pending');
    if (pending.length === 0) {
        container.innerHTML = '<p style="color: gray;">✨ No pending requests at the moment.</p>';
        return;
    }
    
    container.innerHTML = pending.map((req, idx) => `
        <div style="background: #faf9f6; border-radius: 1rem; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #c9a03d;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; align-items: center; gap: 1rem;">
                <div>
                    <strong>${escapeHtml(req.name)}</strong> (${escapeHtml(req.batch)})<br>
                    <small>📧 ${escapeHtml(req.email)} | 📞 ${escapeHtml(req.phone)}</small><br>
                    <small>Roll: ${escapeHtml(req.roll)} | Room: ${escapeHtml(req.allotment || 'N/A')}</small>
                </div>
                <button class="approve-req-btn" data-idx="${idx}" style="background: #2c6e5c; color: white; border: none; padding: 8px 20px; border-radius: 40px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-check-circle"></i> Approve & Issue
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.approve-req-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            const actualPending = db.boneRequests.filter(r => r.status === 'pending');
            const req = actualPending[idx];
            const originalIndex = db.boneRequests.findIndex(r => r.email === req.email && r.createdAt === req.createdAt);
            if (originalIndex !== -1 && db.boneRequests[originalIndex].status === 'pending') {
                db.boneRequests[originalIndex].status = 'approved';
                db.handovers.unshift({
                    name: req.name,
                    batch: req.batch,
                    type: 'Full Set (Approved Request)',
                    date: new Date().toLocaleDateString('en-CA')
                });
                saveDatabase();
                renderPendingRequests();
                renderHandoverTable();
                showToast(`Approved: ${req.name} - Handover added`);
            }
        });
    });
}

// ======================== BONE REQUEST FORM (RECEIVING) ========================
function submitBoneRequest(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to submit request', true);
        openModal('loginModal');
        return;
    }
    
    const agreePolicy = document.querySelector('input[name="agreePolicy"]:checked')?.value;
    if (agreePolicy !== 'হ্যাঁ') {
        showToast('You must agree to the policies to proceed', true);
        return;
    }
    
    const requestData = {
        email: document.getElementById('reqEmail').value,
        name: document.getElementById('reqName').value,
        batch: document.getElementById('reqBatch').value,
        phone: document.getElementById('reqPhone').value,
        allotment: document.getElementById('reqAllotment').value,
        facebook: document.getElementById('reqFacebook').value || '',
        roll: document.getElementById('reqRoll').value,
        shareOpinion: document.querySelector('input[name="shareOpinion"]:checked')?.value || '',
        salat: document.querySelector('input[name="salat"]:checked')?.value || '',
        roza: document.querySelector('input[name="roza"]:checked')?.value || '',
        trust: document.querySelector('input[name="trust"]:checked')?.value || '',
        compensation: document.querySelector('input[name="compensation"]:checked')?.value || '',
        parentObj: document.querySelector('input[name="parentObj"]:checked')?.value || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!requestData.name || !requestData.batch || !requestData.phone || !requestData.roll) {
        showToast('Please fill all required fields', true);
        return;
    }
    
    db.boneRequests.push(requestData);
    saveDatabase();
    closeAllModals();
    showToast('✓ Request submitted successfully! Admin will review soon.');
    
    // Reset form
    document.getElementById('boneRequestForm').reset();
}

// ======================== BONE DONATION FORM (DONATE BONES) ========================
function submitDonationForm(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to donate bones', true);
        openModal('loginModal');
        return;
    }
    
    const donation = {
        name: document.getElementById('donateName').value,
        email: document.getElementById('donateEmail').value,
        phone: document.getElementById('donatePhone').value,
        batch: document.getElementById('donateBatch').value,
        setType: document.getElementById('donateSetType').value,
        message: document.getElementById('donateMessage').value,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    if (!donation.name || !donation.email || !donation.phone || !donation.batch) {
        showToast('Please fill all required fields', true);
        return;
    }
    
    db.boneDonations.push(donation);
    saveDatabase();
    closeAllModals();
    showToast('🦴 Jazakallah Khair! Your donation offer has been recorded. The team will contact you.');
    document.getElementById('donateBoneForm').reset();
}

// ======================== UTILITIES ========================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ======================== EVENT LISTENERS & INIT ========================
function bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page) showPage(page);
            // Close mobile menu after click
            const navLinks = document.getElementById('navLinks');
            if (navLinks && window.innerWidth <= 860) {
                navLinks.classList.remove('show');
            }
        });
    });
    
    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
    
    // Apply button (receive bones)
    const openApplyBtn = document.getElementById('openApplyBtn');
    if (openApplyBtn) {
        openApplyBtn.addEventListener('click', () => {
            if (!currentUser) {
                showToast('Please login to apply for bones', true);
                openModal('loginModal');
                return;
            }
            openModal('applyModal');
        });
    }
    
    // Donate Bones button
    const donateBoneBtn = document.getElementById('donateBoneBtn');
    if (donateBoneBtn) {
        donateBoneBtn.addEventListener('click', () => {
            if (!currentUser) {
                showToast('Please login to donate bones', true);
                openModal('loginModal');
                return;
            }
            openModal('donateModal');
        });
    }
    
    // Modal close buttons
    document.getElementById('closeApplyModal')?.addEventListener('click', () => closeAllModals());
    document.getElementById('closeDonateModal')?.addEventListener('click', () => closeAllModals());
    document.getElementById('closeLoginModal')?.addEventListener('click', () => closeAllModals());
    document.getElementById('closeSignupModal')?.addEventListener('click', () => closeAllModals());
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Login/Signup forms
    const doLoginBtn = document.getElementById('doLoginBtn');
    if (doLoginBtn) {
        doLoginBtn.addEventListener('click', () => {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            handleLogin(email, pass);
        });
    }
    
    const doSignupBtn = document.getElementById('doSignupBtn');
    if (doSignupBtn) {
        doSignupBtn.addEventListener('click', () => {
            const email = document.getElementById('signupEmail').value;
            const pass = document.getElementById('signupPassword').value;
            handleSignup(email, pass);
        });
    }
    
    // Enter key in login/signup forms
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = document.getElementById('loginEmail').value;
                const pass = document.getElementById('loginPassword').value;
                handleLogin(email, pass);
            }
        });
    }
    
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = document.getElementById('signupEmail').value;
                const pass = document.getElementById('signupPassword').value;
                handleSignup(email, pass);
            }
        });
    }
    
    // Toggle between login and signup
    const showSignupLink = document.getElementById('showSignupLink');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal('signupModal');
        });
    }
    
    const showLoginLink = document.getElementById('showLoginLink');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal('loginModal');
        });
    }
    
    // Admin panel
    const updateInventoryBtn = document.getElementById('updateInventoryBtn');
    if (updateInventoryBtn) updateInventoryBtn.addEventListener('click', updateInventoryFromAdmin);
    
    const addHandoverBtn = document.getElementById('addHandoverBtn');
    if (addHandoverBtn) addHandoverBtn.addEventListener('click', addHandoverRecord);
    
    // Form submissions
    const requestForm = document.getElementById('boneRequestForm');
    if (requestForm) requestForm.addEventListener('submit', submitBoneRequest);
    
    const donateForm = document.getElementById('donateBoneForm');
    if (donateForm) donateForm.addEventListener('submit', submitDonationForm);
}

// ======================== INITIALIZATION ========================
document.addEventListener('DOMContentLoaded', () => {
    initializeDatabase();
    renderAuthWidget();
    bindEvents();
    refreshInventoryUI();
    renderHandoverTable();
    showPage('home');
    
    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 860) {
            const navLinks = document.getElementById('navLinks');
            if (navLinks) navLinks.classList.remove('show');
        }
    });
});