// Data storage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentUser = localStorage.getItem('currentUser');

// Get users from localStorage or initialize with default
function getUsers() {
    const users = localStorage.getItem('users');
    if (users) {
        return JSON.parse(users);
    }
    // Default user
    const defaultUsers = [{
        username: 'admin',
        password: 'password123'
    }];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// DOM Elements - Check if they exist before accessing
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Event Listeners for toggling Login/Register forms
if (document.getElementById('show-register')) {
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
    });
}

if (document.getElementById('show-login')) {
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.classList.remove('active');
        loginSection.classList.add('active');
    });
}

// Register Form Submit
if (registerForm) {
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
    
    // Clear previous messages
    registerError.classList.remove('show');
    
    // Validate password length
    if (password.length < 6) {
        registerError.textContent = 'Password must be at least 6 characters';
        registerError.classList.add('show');
        return;
    }
    
    // Get existing users
    const users = getUsers();
    
    // Check if username already exists
    const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        registerError.textContent = 'Username already exists';
        registerError.classList.add('show');
        return;
    }
    
    // Add new user
    users.push({ username, password });
    saveUsers(users);
    
    // Show success and switch to login
    showToast('Account created successfully! Redirecting to login...');
    registerForm.reset();
    
    // Switch to login after 2 seconds
    setTimeout(() => {
        if (loginSection && registerSection) {
            registerSection.classList.remove('active');
            loginSection.classList.add('active');
        } else {
            window.location.href = 'login.html';
        }
    }, 2000);
});
}

// Login Form Submit
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Get registered users
        const users = getUsers();
        
        // Check credentials against registered users (case-insensitive username, case-sensitive password)
        const validUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        
        if (validUser) {
            currentUser = validUser.username;
            localStorage.setItem('currentUser', currentUser);
            loginError.classList.remove('show');
            transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            loginForm.reset();
            if (currentUser === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.classList.add('show');
        }
    });
}

// Logout - using event delegation for dynamically loaded pages
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logout-btn') {
        currentUser = null;
        localStorage.removeItem('currentUser');
        transactions = [];
        updateDisplay();
        window.location.href = 'login.html';
    }
});

// Navigation - for multi-section pages
if (navBtns.length > 0 && contentSections.length > 0) {
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (!section) return;
            
            // Update nav buttons
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });
} 

// Income Form Submit
if (document.getElementById('income-form')) {
    document.getElementById('income-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('income-description').value;
    const amount = parseFloat(document.getElementById('income-amount').value);
    const date = document.getElementById('income-date').value;
    
    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const transaction = {
        id: Date.now(),
        user: currentUser,
        type: 'income',
        description,
        amount,
        date
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDisplay();
    this.reset();
    // Set today's date as default
    document.getElementById('income-date').valueAsDate = new Date();
    });
}

// Expense Form Submit
if (document.getElementById('expense-form')) {
    document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('expense-description').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    
    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    const transaction = {
        id: Date.now(),
        user: currentUser,
        type: 'expense',
        description,
        amount,
        category,
        date
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDisplay();
    this.reset();
    // Set today's date as default
    document.getElementById('expense-date').valueAsDate = new Date();
    });
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update all displays
function updateDisplay() {
    updateDashboard();
    updateIncomeList();
    updateExpenseList();
}

// Update Dashboard
function updateDashboard() {
    const userTransactions = transactions.filter(t => t.user === currentUser);

    const totalIncome = userTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = userTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpense;
    
    if (document.getElementById('total-balance')) {
        document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    }
    if (document.getElementById('total-income')) {
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    }
    if (document.getElementById('total-expense')) {
        document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    }
    
    // Recent transactions (last 5)
    const recentList = document.getElementById('recent-transactions-list');
    if (recentList) {
    const recentTransactions = userTransactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        recentList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
    } else {
        recentList.innerHTML = recentTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
            </div>
        `).join('');
    }
    }
}

// Update Income List
function updateIncomeList() {
    const incomeList = document.getElementById('income-list');
    if (!incomeList) return;
    const incomeTransactions = transactions.filter(t => t.type === 'income' && t.user === currentUser).reverse();
    
    if (incomeTransactions.length === 0) {
        incomeList.innerHTML = '<p class="no-transactions">No income records yet</p>';
    } else {
        incomeList.innerHTML = incomeTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount income">+${formatCurrency(t.amount)}</span>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
            </div>
        `).join('');
    }
}

// Update Expense List
function updateExpenseList() {
    const expenseList = document.getElementById('expense-list');
    if (!expenseList) return;
    const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.user === currentUser).reverse();
    
    if (expenseTransactions.length === 0) {
        expenseList.innerHTML = '<p class="no-transactions">No expense records yet</p>';
    } else {
        expenseList.innerHTML = expenseTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <span class="transaction-amount expense">-${formatCurrency(t.amount)}</span>
                <span class="transaction-category">${t.category}</span>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
            </div>
        `).join('');
    }
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDisplay();
}

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Set default dates
if (document.getElementById('income-date')) {
    document.getElementById('income-date').valueAsDate = new Date();
}
if (document.getElementById('expense-date')) {
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Initialize
updateDisplay();

// Admin Dashboard Logic
const adminUsersTable = document.getElementById('admin-users-body');
const adminTransactionsTable = document.getElementById('admin-transactions-body');

if (adminUsersTable || adminTransactionsTable) {
    if (currentUser !== 'admin') {
        window.location.href = 'login.html';
    } else {
        updateAdminDisplay();
    }
}

function updateAdminDisplay() {
    if (adminUsersTable) {
        const users = getUsers();
        adminUsersTable.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.password}</td>
            </tr>
        `).join('');
    }
    if (adminTransactionsTable) {
        adminTransactionsTable.innerHTML = transactions.map(t => `
            <tr>
                <td>${t.user || 'N/A'}</td>
                <td>${t.type}</td>
                <td>${t.description}</td>
                <td>${formatCurrency(t.amount)}</td>
                <td>${formatDate(t.date)}</td>
            </tr>
        `).join('');
    }
}

// Toast Notification
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
