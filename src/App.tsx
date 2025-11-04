import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ExpensesPage from './pages/ExpensesPage';
import IncomePage from './pages/IncomePage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import CategoriesPage from './pages/CategoriesPage';
import ImportExportPage from './pages/ImportExportPage';
import AddTransactionPage from './pages/AddTransactionPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import BudgetDetailPage from './pages/BudgetDetailPage';
import PlannedBudgetPage from './pages/PlannedBudgetPage';
import EditTransactionPage from './pages/EditTransactionPage';
import EditBudgetPage from './pages/EditBudgetPage';
import AddBudgetPage from './pages/AddBudgetPage';
import SharedBudgetPage from './pages/SharedBudgetPage';

function App() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expenses/add" element={<AddTransactionPage type="expense" />} />
        <Route path="expenses/:id" element={<TransactionDetailPage type="expense" />} />
        <Route path="income" element={<IncomePage />} />
        <Route path="income/add" element={<AddTransactionPage type="income" />} />
        <Route path="incomes/:id" element={<TransactionDetailPage type="income" />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="budgets/planned" element={<PlannedBudgetPage />} />
        <Route path="budgets/add" element={<AddBudgetPage />} />
        <Route path="budgets/:id" element={<BudgetDetailPage />} />
        <Route path="budgets/:id/edit" element={<EditBudgetPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/categories" element={<CategoriesPage />} />
        <Route path="settings/import-export" element={<ImportExportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/expenses/:id/edit" element={<EditTransactionPage />} /> 
        <Route path="/incomes/:id/edit" element={<EditTransactionPage />} />
        <Route path="/share/:id" element={<SharedBudgetPage />} />
      </Route>
    </Routes>
  );
}

export default App;