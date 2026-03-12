const API_URL = 'https://steammotor-production.up.railway.app/api';

// Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    } else if (token && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

async function login(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        alert('Error connecting to server');
    }
}

// Global fetch helper with auth header
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`; // Though we didn't implement jwt middleware, it's good practice
    
    // For this simple demo without full JWT middleware on all endpoints we could just proceed
    // We didn't add JWT validation middleware to the Fiber app yet, so it's technically open, but we send it anyway
    
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (res.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }
    return res;
}

// format currency
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const formatRupiahInput = (value) => {
    let numberString = value.toString().replace(/[^,\d]/g, '');
    const split = numberString.split(',');
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
};

const unformatRupiah = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
};

// Harga standar per jenis kendaraan
const PRICE_MAP = {
    'Matic Kecil':    12000,
    'Matic Besar':    15000,
    'Motor Bebek':    12000,
    'Sport CC Kecil': 15000,
    'Sport CC Besar': 30000,
    'Cruiser':        35000,
    'Mobil Kecil':    45000,
    'Motor Besar':    60000,
};

function autoFillPrice() {
    const jenis = document.getElementById('trx-jenis').value;
    const hargaInput = document.getElementById('trx-harga');
    if (PRICE_MAP[jenis] !== undefined) {
        hargaInput.value = formatRupiahInput(PRICE_MAP[jenis].toString());
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const now = new Date();
        const today = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0');
        
        const res = await apiFetch(`/reports?tanggal=${today}`);
        const data = await res.json();
        
        document.getElementById('today-motor').textContent = data.today_motor || 0;
        document.getElementById('today-income').textContent = formatRupiah(data.today_income || 0);
        document.getElementById('month-motor').textContent = data.month_motor || 0;
        document.getElementById('month-income').textContent = formatRupiah(data.month_income || 0);
    } catch (e) {
        console.error('Failed to load dashboard data', e);
    }
}

// Transactions
let currentEditId = null;

async function loadTransactions(searchDate = '', searchNopol = '') {
    try {
        let endpoint = '/transactions';
        const params = new URLSearchParams();
        if (searchDate) params.append('tanggal', searchDate);
        if (searchNopol) params.append('no_polisi', searchNopol);
        if (params.toString()) endpoint += '?' + params.toString();
        
        const res = await apiFetch(endpoint);
        const data = await res.json();
        
        const tbody = document.getElementById('transaction-body');
        tbody.innerHTML = '';
        
        data.forEach(trx => {
            const tr = document.createElement('tr');
            // Standardize date display to YYYY-MM-DD
            const displayDate = trx.tanggal.split('T')[0];

            // Color-code by vehicle type
            const badgeMap = {
                'Matic Kecil':    'badge-purple',
                'Matic Besar':    'badge-purple',
                'Motor Bebek':    'badge-green',
                'Sport CC Kecil': 'badge-cyan',
                'Sport CC Besar': 'badge-blue',
                'Cruiser':        'badge-orange',
                'Motor Besar':    'badge-orange',
                'Mobil Kecil':    'badge-blue',
            };
            const badgeClass = badgeMap[trx.jenis_kendaraan] || 'badge-blue';

            tr.innerHTML = `
                <td style="color:var(--text-muted);font-size:0.82rem;">${displayDate}</td>
                <td><strong>${trx.no_polisi}</strong></td>
                <td style="font-size:0.875rem;">${trx.nama_pemilik || '-'}</td>
                <td><span class="badge ${badgeClass}">${trx.jenis_kendaraan}</span></td>
                <td style="font-weight:700;">${formatRupiah(trx.harga)}</td>
                <td>${trx.petugas}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editTransaction(${trx.id})" class="btn btn-sm btn-accent"><i class="fas fa-pen"></i> Edit</button>
                        <button onclick="deleteTransaction(${trx.id})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Failed to load transactions', e);
    }
}

// Modal handling
function openModal(isEdit = false) {
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Transaksi' : 'Tambah Transaksi';
    
    // Always lock the date field to today only (prevent fraud)
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    const dateInput = document.getElementById('trx-tanggal');
    dateInput.setAttribute('min', today);
    dateInput.setAttribute('max', today);
    
    if (!isEdit) {
        dateInput.value = today;
        document.getElementById('trx-pemilik').value = '';
        document.getElementById('trx-jenis').value = ''; // Jangan auto-pilih
        document.getElementById('trx-harga').value = ''; // Kosongkan harga
    }
    
    document.getElementById('transaction-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('transaction-modal').classList.remove('active');
    document.getElementById('transaction-form').reset();
    currentEditId = null;
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    // Create payload
    const payload = {
        tanggal: document.getElementById('trx-tanggal').value,
        no_polisi: document.getElementById('trx-nopol').value,
        nama_pemilik: document.getElementById('trx-pemilik').value,
        jenis_kendaraan: document.getElementById('trx-jenis').value,
        harga: unformatRupiah(document.getElementById('trx-harga').value),
        petugas: document.getElementById('trx-petugas').value
    };
    
    try {
        let res;
        if (currentEditId) {
            res = await apiFetch(`/transactions/${currentEditId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        } else {
            res = await apiFetch(`/transactions`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            closeModal();
            loadTransactions();
            // Also refresh dashboard if we are on that page or just to be safe
            if (typeof loadDashboard === 'function') loadDashboard();
        } else {
            alert('Gagal menyimpan transaksi');
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        try {
            const res = await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadTransactions();
            }
        } catch (e) {
            alert('Error deleting transaction: ' + e.message);
        }
    }
}

async function editTransaction(id) {
    try {
        await syncPetugasDropdown(); // Pastikan list petugas sudah ada
        const res = await apiFetch(`/transactions`);
        const data = await res.json();
        const trx = data.find(t => t.id === id);
        if (trx) {
            currentEditId = trx.id;
            document.getElementById('trx-tanggal').value = trx.tanggal.split('T')[0];
            document.getElementById('trx-nopol').value = trx.no_polisi;
            document.getElementById('trx-pemilik').value = trx.nama_pemilik || '';
            document.getElementById('trx-jenis').value = trx.jenis_kendaraan;
            document.getElementById('trx-harga').value = formatRupiahInput(trx.harga.toString());
            document.getElementById('trx-petugas').value = trx.petugas;
            openModal(true);
        }
    } catch(e) {
        console.error(e);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Attach event listeners based on page
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', login);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Dashboard page specific
    if (document.getElementById('today-motor')) {
        loadDashboard();
    }
    
    // Transactions page specific
    if (document.getElementById('transaction-body')) {
        loadTransactions();
        
        document.getElementById('btn-add').addEventListener('click', () => {
            syncPetugasDropdown(); // Ambil list petugas terbaru
            openModal(false);
        });
        document.getElementById('btn-cancel').addEventListener('click', closeModal);
        document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);
        
        // Auto-fill harga saat jenis kendaraan berubah
        document.getElementById('trx-jenis').addEventListener('change', autoFillPrice);
        
        // Auto-format currency on type
        const trxHarga = document.getElementById('trx-harga');
        if (trxHarga) trxHarga.addEventListener('input', function() { this.value = formatRupiahInput(this.value); });
        
        // Search
        document.getElementById('search-nopol').addEventListener('input', (e) => {
            const date = document.getElementById('search-date').value;
            loadTransactions(date, e.target.value);
        });
        document.getElementById('search-date').addEventListener('change', (e) => {
            const nopol = document.getElementById('search-nopol').value;
            loadTransactions(e.target.value, nopol);
        });
    }

    // Pengeluaran page specific
    if (document.getElementById('expense-body')) {
        // ... existing logic ...
        // (Ensuring it stays)
        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
        const filterEl = document.getElementById('filter-month');
        if (filterEl) filterEl.value = currentMonth;
        loadExpenses(currentMonth);
        document.getElementById('btn-add-exp').addEventListener('click', () => openExpenseModal(false));
        document.getElementById('btn-cancel-exp').addEventListener('click', closeExpenseModal);
        document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);
        if (filterEl) {
            filterEl.addEventListener('change', (e) => loadExpenses(e.target.value));
        }
        
        // Auto-format currency on type
        const expJumlah = document.getElementById('exp-jumlah');
        if (expJumlah) expJumlah.addEventListener('input', function() { this.value = formatRupiahInput(this.value); });
    }

    // Laporan page specific
    if (document.getElementById('report-body')) {
        const filterYear = document.getElementById('filter-year');
        loadMonthlyReport(filterYear.value);
        filterYear.addEventListener('change', (e) => loadMonthlyReport(e.target.value));
    }

    // Petugas page specific
    if (document.getElementById('petugas-body')) {
        loadPetugases();
        document.getElementById('btn-add-petugas').addEventListener('click', () => openPetugasModal(false));
        document.getElementById('petugas-form').addEventListener('submit', handlePetugasSubmit);
        
        const salaryFilter = document.getElementById('filter-month-salary');
        if (salaryFilter) {
            const now = new Date();
            const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            salaryFilter.value = currentMonth;
            salaryFilter.addEventListener('change', (e) => loadPetugasStats(e.target.value));
        }
    }
});

// ===================== PENGELUARAN (EXPENSES) =====================

let currentEditExpId = null;

async function loadExpenses(filterMonth = '') {
    try {
        let endpoint = '/expenses';
        if (filterMonth) endpoint += `?bulan=${filterMonth}`;

        const res = await apiFetch(endpoint);
        const data = await res.json();

        const tbody = document.getElementById('expense-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let total = 0;
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">Belum ada pengeluaran</td></tr>`;
        } else {
            data.forEach(exp => {
                total += exp.jumlah;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color:var(--text-muted);font-size:0.82rem;">${exp.tanggal.split('T')[0]}</td>
                    <td>${exp.keterangan}</td>
                    <td style="font-weight:700;color:#f87171;">${formatRupiah(exp.jumlah)}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="editExpense(${exp.id})" class="btn btn-sm btn-accent"><i class="fas fa-pen"></i> Edit</button>
                            <button onclick="deleteExpense(${exp.id})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        const sumEl = document.getElementById('total-expense-sum');
        if (sumEl) sumEl.textContent = formatRupiah(total);
    } catch (e) {
        console.error('Failed to load expenses', e);
    }
}

function openExpenseModal(isEdit = false) {
    document.getElementById('exp-modal-title').textContent = isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran';
    if (!isEdit) {
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        document.getElementById('exp-tanggal').value = today;
        document.getElementById('exp-keterangan').value = '';
        document.getElementById('exp-jumlah').value = '';
    }
    document.getElementById('expense-modal').classList.add('active');
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('active');
    currentEditExpId = null;
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    const payload = {
        tanggal: document.getElementById('exp-tanggal').value,
        keterangan: document.getElementById('exp-keterangan').value,
        jumlah: unformatRupiah(document.getElementById('exp-jumlah').value)
    };
    try {
        let res;
        if (currentEditExpId) {
            res = await apiFetch(`/expenses/${currentEditExpId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        } else {
            res = await apiFetch('/expenses', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        }
        if (res.ok) {
            closeExpenseModal();
            const filterEl = document.getElementById('filter-month');
            loadExpenses(filterEl ? filterEl.value : '');
        } else {
            alert('Gagal menyimpan pengeluaran');
        }
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteExpense(id) {
    if (confirm('Hapus pengeluaran ini?')) {
        try {
            await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
            const filterEl = document.getElementById('filter-month');
            loadExpenses(filterEl ? filterEl.value : '');
        } catch (e) { alert('Error: ' + e.message); }
    }
}

async function editExpense(id) {
    try {
        const res = await apiFetch('/expenses');
        const data = await res.json();
        const exp = data.find(e => e.id === id);
        if (exp) {
            currentEditExpId = exp.id;
            document.getElementById('exp-tanggal').value = exp.tanggal.split('T')[0];
            document.getElementById('exp-keterangan').value = exp.keterangan;
            document.getElementById('exp-jumlah').value = formatRupiahInput(exp.jumlah.toString());
            openExpenseModal(true);
        }
    } catch (e) { console.error(e); }
}

// ===================== LAPORAN (REPORT) =====================

async function loadMonthlyReport(year = '') {
    try {
        let endpoint = '/monthly-summary';
        if (year) endpoint += `?tahun=${year}`;

        const res = await apiFetch(endpoint);
        const data = await res.json();

        const tbody = document.getElementById('report-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:3rem;">Belum ada data rekapan</td></tr>`;
        } else {
            data.forEach(item => {
                const tr = document.createElement('tr');
                const netColor = item.laba_bersih >= 0 ? '#34d399' : '#f87171';
                tr.innerHTML = `
                    <td style="font-weight:700;">${item.bulan}</td>
                    <td style="color:#a78bfa;">${formatRupiah(item.total_pendapatan)}</td>
                    <td style="color:#f87171;">${formatRupiah(item.total_pengeluaran)}</td>
                    <td style="font-weight:800;color:${netColor};">${formatRupiah(item.laba_bersih)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Failed to load monthly reports', e);
    }
}

// ===================== PETUGAS =====================

let currentEditPetugasId = null;

async function loadPetugases() {
    try {
        const res = await apiFetch('/petugases');
        const data = await res.json();
        const tbody = document.getElementById('petugas-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nama}</td>
                <td>
                    <span class="status-badge ${p.aktif ? 'status-paid' : 'status-unpaid'}">
                        ${p.aktif ? 'Aktif' : 'Non-Aktif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editPetugas(${p.id})" class="btn btn-sm btn-accent"><i class="fas fa-pen"></i></button>
                        <button onclick="deletePetugas(${p.id})" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error('Failed to load petugases', e); }
}

function openPetugasModal(isEdit = false) {
    document.getElementById('petugas-modal-title').textContent = isEdit ? 'Edit Petugas' : 'Tambah Petugas';
    if (!isEdit) {
        document.getElementById('p-nama').value = '';
        document.getElementById('p-aktif').value = '1';
        currentEditPetugasId = null;
    }
    document.getElementById('petugas-modal').classList.add('active');
}

function closePetugasModal() {
    document.getElementById('petugas-modal').classList.remove('active');
}

async function handlePetugasSubmit(e) {
    e.preventDefault();
    const payload = {
        nama: document.getElementById('p-nama').value,
        aktif: parseInt(document.getElementById('p-aktif').value)
    };
    try {
        let res;
        if (currentEditPetugasId) {
            res = await apiFetch(`/petugases/${currentEditPetugasId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        } else {
            res = await apiFetch('/petugases', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        }
        if (res.ok) {
            closePetugasModal();
            loadPetugases();
        } else {
            alert('Gagal menyimpan petugas');
        }
    } catch (e) { alert('Error: ' + e.message); }
}

async function editPetugas(id) {
    try {
        const res = await apiFetch('/petugases');
        const data = await res.json();
        const p = data.find(item => item.id === id);
        if (p) {
            currentEditPetugasId = p.id;
            document.getElementById('p-nama').value = p.nama;
            document.getElementById('p-aktif').value = p.aktif.toString();
            openPetugasModal(true);
        }
    } catch (e) { console.error(e); }
}

async function deletePetugas(id) {
    if (confirm('Hapus petugas ini?')) {
        try {
            await apiFetch(`/petugases/${id}`, { method: 'DELETE' });
            loadPetugases();
        } catch (e) { alert('Error: ' + e.message); }
    }
}

// Stats & Gaji
async function loadPetugasStats(bulan = '') {
    try {
        if (!bulan) {
            const now = new Date();
            bulan = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        }
        document.getElementById('filter-month-salary').value = bulan;

        const res = await apiFetch(`/petugas-stats?bulan=${bulan}`);
        const data = await res.json();
        const tbody = document.getElementById('salary-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        data.forEach(item => {
            const tr = document.createElement('tr');
            
            let statusHtml = '';
            let btnHtml = '';
            
            if (item.sudah_dibayar) {
                statusHtml = `<span class="status-badge status-paid">Lunas</span>`;
                btnHtml = `<i class="fas fa-check-circle" style="color:var(--success);"></i>`;
            } else if (item.total_dibayar > 0 && item.sisa_gaji > 0) {
                statusHtml = `<span class="status-badge status-warning">Kurang Bayar</span>`;
                btnHtml = `<button onclick="paySalary('${item.nama}', '${bulan}', ${item.sisa_gaji})" class="btn btn-sm btn-primary">Bayar Sisa</button>`;
            } else if (item.total_gaji > 0) {
                statusHtml = `<span class="status-badge status-unpaid">Belum Dibayar</span>`;
                btnHtml = `<button onclick="paySalary('${item.nama}', '${bulan}', ${item.total_gaji})" class="btn btn-sm btn-primary">Catat Gaji</button>`;
            } else {
                statusHtml = `<span class="status-badge status-paid" style="opacity:0.5;">Belum Ada</span>`;
                btnHtml = `-`;
            }

            tr.innerHTML = `
                <td>${item.nama}</td>
                <td>${item.jumlah_motor} Motor</td>
                <td>
                    <div style="font-weight:700;">${formatRupiah(item.total_gaji)}</div>
                    ${item.total_dibayar > 0 ? `<div style="font-size:0.75rem;color:var(--success);">Sudah: ${formatRupiah(item.total_dibayar)}</div>` : ''}
                    ${item.sisa_gaji > 0 && item.total_dibayar > 0 ? `<div style="font-size:0.75rem;color:var(--danger);">Sisa: ${formatRupiah(item.sisa_gaji)}</div>` : ''}
                </td>
                <td>${statusHtml}</td>
                <td>${btnHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error('Failed to load salary stats', e); }
}

async function paySalary(nama, bulan, gaji) {
    if (!confirm(`Catat gaji ${nama} sebesar ${formatRupiah(gaji)} ke pengeluaran?`)) return;
    try {
        const res = await apiFetch('/petugas-salary', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nama, bulan, gaji })
        });
        if (res.ok) {
            loadPetugasStats(bulan);
        } else {
            const err = await res.json();
            alert(err.error || 'Gagal mencatat gaji');
        }
    } catch (e) { alert('Error: ' + e.message); }
}

async function syncPetugasDropdown() {
    const sel = document.getElementById('trx-petugas');
    if (!sel) return;
    try {
        const res = await apiFetch('/petugases');
        const data = await res.json();
        
        // Keep placeholder
        const placeholder = sel.querySelector('option[disabled]');
        sel.innerHTML = '';
        if (placeholder) sel.appendChild(placeholder);

        data.filter(p => p.aktif).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nama;
            opt.textContent = p.nama;
            sel.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}
