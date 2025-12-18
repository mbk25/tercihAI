const API_URL = 'http://localhost:3000';
let authToken = null;

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.dataset.page;
        showPage(pageName);
    });
});

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Giriş başarısız');
        }

        const data = await response.json();
        authToken = data.token;
        localStorage.setItem('adminToken', authToken);

        // Show admin panel
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';

        // Load dashboard data
        loadDashboard();

    } catch (error) {
        alert('Giriş başarısız! Kullanıcı adı veya şifre hatalı.');
        console.error('Login error:', error);
    }
}

// Logout
function handleLogout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    loginContainer.style.display = 'flex';
    adminContainer.style.display = 'none';
}

// Show Page
function showPage(pageName) {
    // Update nav
    navItems.forEach(item => {
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update pages
    pages.forEach(page => {
        if (page.id === pageName) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    // Load page data
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'analyses') {
        loadAnalyses();
    } else if (pageName === 'universities') {
        loadUniversities();
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Update stats
        document.getElementById('totalAnalyses').textContent = data.totalAnalyses || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalUniversities').textContent = '450+';
        document.getElementById('successRate').textContent = '85%';

        // Update recent analyses table
        const tableBody = document.getElementById('recentAnalysesTable');
        tableBody.innerHTML = '';

        if (data.recentAnalyses && data.recentAnalyses.length > 0) {
            data.recentAnalyses.forEach(analysis => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(analysis.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>${analysis.ranking?.toLocaleString() || 'N/A'}</td>
                    <td>${analysis.dreamDept || 'N/A'}</td>
                    <td>${analysis.city || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${analysis.results?.isEligible ? 'status-success' : 'status-warning'}">
                            ${analysis.results?.isEligible ? 'Uygun' : 'Alternatif'}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Henüz analiz yok</td></tr>';
        }

    } catch (error) {
        console.error('Dashboard error:', error);
        document.getElementById('recentAnalysesTable').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">Veri yüklenemedi</td></tr>';
    }
}

// Load Analyses
async function loadAnalyses() {
    try {
        const response = await fetch(`${API_URL}/api/admin/analyses`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch analyses');

        const analyses = await response.json();
        const tableBody = document.getElementById('allAnalysesTable');
        tableBody.innerHTML = '';

        if (analyses && analyses.length > 0) {
            analyses.forEach((analysis, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${new Date(analysis.createdAt).toLocaleString('tr-TR')}</td>
                    <td>${analysis.ranking?.toLocaleString() || 'N/A'}</td>
                    <td>${analysis.gender || 'N/A'}</td>
                    <td>${analysis.dreamDept || 'N/A'}</td>
                    <td>${analysis.city || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${analysis.results?.isEligible ? 'status-success' : 'status-warning'}">
                            ${analysis.results?.isEligible ? 'Uygun' : 'Alternatif'}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Henüz analiz yok</td></tr>';
        }

    } catch (error) {
        console.error('Analyses error:', error);
    }
}

// Load Universities
async function loadUniversities() {
    // This would fetch from database
    console.log('Loading universities...');
}

// Update University Data
document.getElementById('updateDataForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const department = document.getElementById('updateDepartment').value;
    const year = document.getElementById('updateYear').value;

    try {
        const response = await fetch(`${API_URL}/api/admin/universities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ department, year })
        });

        if (!response.ok) throw new Error('Update failed');

        const result = await response.json();
        alert(`Başarılı! ${result.count} üniversite verisi güncellendi.`);

    } catch (error) {
        console.error('Update error:', error);
        alert('Güncelleme başarısız!');
    }
});

// Check if already logged in
const savedToken = localStorage.getItem('adminToken');
if (savedToken) {
    authToken = savedToken;
    loginContainer.style.display = 'none';
    adminContainer.style.display = 'flex';
    loadDashboard();
}

console.log('🔐 Admin Panel yüklendi');
console.log('📡 API URL:', API_URL);
