// SpendWise - Daily Expense Tracker
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        console.log('Initializing ExpenseTracker...');
        
        // Hide loading overlay if it exists
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
            loadingOverlay.style.display = 'none';
        }
        
        this.loadExpenses();
        console.log('Loaded expenses:', this.expenses.length);
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderExpenses();
        this.updateSummary();
        this.updateCategoryBreakdown();
        this.loadDarkMode();
        console.log('ExpenseTracker initialized successfully');
    }

    setupEventListeners() {
        // Form submission - handle both form submit and button click
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addExpense();
                return false;
            });
        }

        // Add expense button click
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addExpense();
                return false;
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderExpenses();
            });
        }

        // Clear all expenses
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
                    this.clearAllExpenses();
                }
            });
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Amount input validation - prevent dollar signs and format input
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            // Clean input on change - remove any non-numeric characters except decimal
            amountInput.addEventListener('input', (e) => {
                let value = e.target.value;
                // Remove dollar signs, commas, and other non-numeric characters except decimal point
                value = value.replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                // Update the value if it changed
                if (e.target.value !== value) {
                    e.target.value = value;
                }
                // Clear any validation errors when user types
                e.target.setCustomValidity('');
            });

            // Handle paste events - clean pasted content
            amountInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    e.target.value = value;
                }, 0);
            });

            // Prevent invalid characters on keypress (but allow number input to work normally)
            amountInput.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                // Allow numbers, decimal point, and control keys
                if (!/[0-9.]/.test(char) && !e.ctrlKey && !e.metaKey) {
                    // Block dollar sign specifically
                    if (e.which === 36 || char === '$') {
                        e.preventDefault();
                        return false;
                    }
                }
            });
        }
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    addExpense() {
        try {
            console.log('Adding expense...');
            const title = document.getElementById('title').value.trim();
            const amountField = document.getElementById('amount');
            // Strip dollar signs, commas, and other non-numeric characters except decimal point
            const amountInput = amountField.value.replace(/[^0-9.]/g, '');
            const amount = parseFloat(amountInput);
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;

            console.log('Form values:', { title, amount, category, date });

            // Validation
            if (!amountField.value.trim() || !amount || amount <= 0 || isNaN(amount)) {
                amountField.focus();
                amountField.setCustomValidity('Please enter a valid amount greater than 0');
                amountField.reportValidity();
                this.showError('Please enter a valid amount greater than 0');
                return false;
            } else {
                amountField.setCustomValidity('');
            }

            if (!category) {
                this.showError('Please select a category');
                return false;
            }

            if (!date) {
                this.showError('Please select a date');
                return false;
            }

            // Create expense object
            const expense = {
                id: Date.now().toString(),
                title: title || 'Untitled Expense',
                amount: amount,
                category: category,
                date: date,
                timestamp: new Date().toISOString()
            };

            console.log('Created expense:', expense);

            // Add to expenses array
            this.expenses.unshift(expense);
            console.log('Total expenses:', this.expenses.length);

            // Save to localStorage
            this.saveExpenses();
            console.log('Saved to localStorage');

            // Reset form
            const form = document.getElementById('expenseForm');
            if (form) {
                form.reset();
            }
            this.setDefaultDate();

            // Update UI
            console.log('Updating UI...');
            this.renderExpenses();
            this.updateSummary();
            this.updateCategoryBreakdown();
            console.log('UI updated');

            // Show success message
            this.showSuccess('Expense added successfully!');
            
            return false; // Prevent form submission
        } catch (error) {
            console.error('Error adding expense:', error);
            this.showError('An error occurred while adding the expense. Please try again.');
            return false;
        }
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.updateSummary();
            this.updateCategoryBreakdown();
            this.showSuccess('Expense deleted successfully!');
        }
    }

    clearAllExpenses() {
        this.expenses = [];
        this.saveExpenses();
        this.renderExpenses();
        this.updateSummary();
        this.updateCategoryBreakdown();
        this.showSuccess('All expenses cleared!');
    }

    getFilteredExpenses() {
        // This method is now handled directly in renderExpenses for better sorting
        if (this.currentFilter === 'all') {
            return this.expenses;
        }
        return this.expenses.filter(expense => expense.category === this.currentFilter);
    }

    renderExpenses() {
        const expensesList = document.getElementById('expensesList');
        if (!expensesList) {
            console.error('expensesList element not found');
            return;
        }

        // Sort expenses by date (newest first) and then by timestamp
        const sortedExpenses = [...this.expenses].sort((a, b) => {
            const dateCompare = new Date(b.date) - new Date(a.date);
            if (dateCompare !== 0) return dateCompare;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        const filteredExpenses = this.currentFilter === 'all' 
            ? sortedExpenses 
            : sortedExpenses.filter(expense => expense.category === this.currentFilter);

        if (filteredExpenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💸</div>
                    <h3>No expenses yet</h3>
                    <p>Start tracking your expenses by adding your first one!</p>
                    <button class="btn-primary" onclick="document.getElementById('title').focus()">Add First Expense</button>
                </div>
            `;
            return;
        }

        const expensesHTML = filteredExpenses.map(expense => {
            const deleteHandler = `expenseTracker.deleteExpense('${expense.id}')`;
            return `
                <div class="expense-item">
                    <div class="expense-details">
                        <div class="expense-title">${this.escapeHtml(expense.title)}</div>
                        <div class="expense-meta">
                            <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                            <span class="expense-category">${this.getCategoryIcon(expense.category)} ${expense.category}</span>
                            <span class="expense-date">${this.formatDate(expense.date)}</span>
                        </div>
                    </div>
                    <div class="expense-actions">
                        <button class="btn btn-delete" onclick="${deleteHandler}">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        expensesList.innerHTML = expensesHTML;
    }

    updateSummary() {
        const todayTotalEl = document.getElementById('todayTotal');
        const monthlyTotalEl = document.getElementById('monthlyTotal');
        
        if (!todayTotalEl || !monthlyTotalEl) {
            console.warn('Summary elements not found');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const todayTotal = this.expenses
            .filter(expense => expense.date === today)
            .reduce((sum, expense) => sum + expense.amount, 0);

        const monthlyTotal = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        todayTotalEl.textContent = `$${todayTotal.toFixed(2)}`;
        monthlyTotalEl.textContent = `$${monthlyTotal.toFixed(2)}`;
    }

    updateCategoryBreakdown() {
        const categoryTotals = {};
        const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

        // Initialize categories
        categories.forEach(category => {
            categoryTotals[category] = 0;
        });

        // Calculate totals
        this.expenses.forEach(expense => {
            if (categoryTotals.hasOwnProperty(expense.category)) {
                categoryTotals[expense.category] += expense.amount;
            }
        });

        // Find max amount for scaling
        const maxAmount = Math.max(...Object.values(categoryTotals), 1);

        // Generate category bars HTML
        const categoryBarsHTML = Object.entries(categoryTotals)
            .filter(([_, amount]) => amount > 0)
            .map(([category, amount]) => {
                const percentage = (amount / maxAmount) * 100;
                return `
                    <div class="category-bar">
                        <div class="category-label">${this.getCategoryIcon(category)} ${category}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%">
                                <span class="bar-amount">$${amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        const categoryBarsElement = document.getElementById('categoryBars');
        
        if (!categoryBarsElement) {
            console.warn('categoryBars element not found');
            return;
        }
        
        if (categoryBarsHTML) {
            categoryBarsElement.innerHTML = `<div class="category-bars">${categoryBarsHTML}</div>`;
        } else {
            categoryBarsElement.innerHTML = '<p class="no-expenses">No expenses to display</p>';
        }

        // Update insights
        this.updateInsights(categoryTotals);
    }

    updateInsights(categoryTotals) {
        // Update highest category
        const highestCategoryElement = document.getElementById('highestCategory');
        if (highestCategoryElement) {
            const highestCategoryEntry = Object.entries(categoryTotals)
                .filter(([_, amount]) => amount > 0)
                .sort(([_, a], [__, b]) => b - a)[0];
            
            if (highestCategoryEntry) {
                const [category, amount] = highestCategoryEntry;
                highestCategoryElement.textContent = `${this.getCategoryIcon(category)} ${category} ($${amount.toFixed(2)})`;
            } else {
                highestCategoryElement.textContent = '-';
            }
        }

        // Update average daily spend
        const avgDailySpendElement = document.getElementById('avgDailySpend');
        if (avgDailySpendElement) {
            if (this.expenses.length > 0) {
                const totalAmount = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                const uniqueDates = new Set(this.expenses.map(expense => expense.date));
                const avgDaily = uniqueDates.size > 0 ? totalAmount / uniqueDates.size : 0;
                avgDailySpendElement.textContent = `$${avgDaily.toFixed(2)}`;
            } else {
                avgDailySpendElement.textContent = '$0.00';
            }
        }

        // Update total expenses count
        const totalExpensesElement = document.getElementById('totalExpenses');
        if (totalExpensesElement) {
            totalExpensesElement.textContent = this.expenses.length.toString();
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Food': '🍔',
            'Travel': '✈️',
            'Bills': '📄',
            'Shopping': '🛍️',
            'Other': '📦'
        };
        return icons[category] || '📦';
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveExpenses() {
        localStorage.setItem('spendwise_expenses', JSON.stringify(this.expenses));
    }

    loadExpenses() {
        const saved = localStorage.getItem('spendwise_expenses');
        if (saved) {
            try {
                this.expenses = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading expenses:', e);
                this.expenses = [];
            }
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('spendwise_darkmode', isDarkMode);
        
        // Update toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }

    loadDarkMode() {
        const isDarkMode = localStorage.getItem('spendwise_darkmode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').textContent = '☀️';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${type === 'error' ? 'background-color: #ef4444;' : 'background-color: #10b981;'}
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Add to DOM
        document.body.appendChild(messageElement);

        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is ready
let expenseTracker;

function initializeApp() {
    expenseTracker = new ExpenseTracker();
    
    // Add some sample data for demonstration (optional)
    // Uncomment the lines below to add sample data on first load
    /*
    if (expenseTracker.expenses.length === 0) {
        const sampleExpenses = [
            {
                id: '1',
                title: 'Morning Coffee',
                amount: 4.50,
                category: 'Food',
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Uber Ride',
                amount: 12.00,
                category: 'Travel',
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            },
            {
                id: '3',
                title: 'Electric Bill',
                amount: 85.00,
                category: 'Bills',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        expenseTracker.expenses = sampleExpenses;
        expenseTracker.saveExpenses();
        expenseTracker.renderExpenses();
        expenseTracker.updateSummary();
        expenseTracker.updateCategoryBreakdown();
    }
    */
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

