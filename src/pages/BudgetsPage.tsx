import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, AlertTriangle, Copy, ClipboardList, Scale, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { 
  formatCurrency, 
  getBudgetSpent, 
  getBudgetRemaining,
  getBudgetPercentage
} from '../utils/formatters';
import { useTranslation } from 'react-i18next';

const BudgetsPage: React.FC = () => {
  const { budgets, transactions, categories, settings, applyPlannedBudgets, addBudget, deleteBudget, updateBudget } = useData();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [overBudgetToBalance, setOverBudgetToBalance] = useState<any>(null);
  const [selectedTargetBudget, setSelectedTargetBudget] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [budgetToClose, setBudgetToClose] = useState<any>(null);
  const [selectedCloseTarget, setSelectedCloseTarget] = useState<string | null>(null);
  
  // Filter transactions by date range
  const [year, month] = selectedMonth.split('-').map(Number);
  const selectedDate = new Date(year, month - 1);
  const nextMonth = new Date(year, month);
  
  // Get current month's budgets (non-template)
  const monthlyBudgets = budgets.filter(
    b => !b.isTemplate && 
    new Date(b.startDate) >= selectedDate && 
    new Date(b.startDate) < nextMonth
  );
  
  // Adaptation pour gérer plusieurs catégories par budget
  const budgetsWithProgress = monthlyBudgets.map((budget) => {
    // Supporte budget.categories (string[]) ou budget.category (string)
    const budgetCategories = (budget.categories && Array.isArray(budget.categories)
      ? budget.categories
      : [budget.category]
    ).filter((c): c is string => typeof c === 'string');

    // Calcule le montant dépensé pour toutes les catégories du budget
    const spent = transactions
      .filter(t => budgetCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = Math.min((spent / budget.amount) * 100, 100);

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      budgetCategories,
    };
  })
  .sort((a, b) => {
    // Tri : dépassés d'abord, puis en cours, puis clôturés
    const aOver = a.remaining < 0;
    const bOver = b.remaining < 0;
    const aFinished = a.remaining === 0;
    const bFinished = b.remaining === 0;
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;
    if (!aFinished && bFinished) return -1;
    if (aFinished && !bFinished) return 1;
    return 0;
  });
  
  const months = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  const handleResetBudgets = () => {
    // Clear existing monthly budgets
    const nonTemplateBudgets = budgets.filter(b => !b.isTemplate);
    nonTemplateBudgets.forEach(budget => deleteBudget(budget.id));

    // Copy planned budgets as new monthly budgets
    const plannedBudgets = budgets.filter(b => b.isTemplate);
    plannedBudgets.forEach(plannedBudget => {
      addBudget({
        ...plannedBudget,
        isTemplate: false,
        startDate: new Date().toISOString().split('T')[0],
      });
    });

    setShowResetConfirm(false);
  };

  // Fonction pour équilibrer les budgets
  const handleBalanceClick = (budget: any) => {
    setOverBudgetToBalance(budget);
    setShowBalanceModal(true);
  };

  const handleSelectTargetBudget = (budgetId: string) => {
    setSelectedTargetBudget(budgetId);
  };

  const handleConfirmBalance = () => {
    if (!overBudgetToBalance || !selectedTargetBudget) return;
    const overAmount = Math.abs(overBudgetToBalance.remaining);
    const targetBudget = monthlyBudgets.find(b => b.id === selectedTargetBudget);
    if (!targetBudget || targetBudget.amount - overAmount < 0) return;
    // Met à jour les deux budgets (modifie les existants)
    updateBudget({
      ...targetBudget,
      amount: targetBudget.amount - overAmount,
    });
    updateBudget({
      ...overBudgetToBalance,
      amount: overBudgetToBalance.amount + overAmount,
    });
    setShowBalanceModal(false);
    setOverBudgetToBalance(null);
    setSelectedTargetBudget(null);
  };

  const handleCloseClick = (budget: any) => {
    setBudgetToClose(budget);
    setShowCloseModal(true);
  };

  const handleSelectCloseTarget = (budgetId: string) => {
    setSelectedCloseTarget(budgetId);
  };

  const handleConfirmClose = () => {
    if (!budgetToClose) return;
    const remaining = budgetToClose.remaining;
    // Si un budget cible est sélectionné, reverse le restant
    if (selectedCloseTarget && remaining > 0) {
      const targetBudget = monthlyBudgets.find(b => b.id === selectedCloseTarget);
      if (targetBudget) {
        updateBudget({
          ...targetBudget,
          amount: targetBudget.amount + remaining,
        });
      }
    }
    // Clôture le budget en mettant le montant à ce qui a été dépensé
    updateBudget({
      ...budgetToClose,
      amount: budgetToClose.spent,
    });
    setShowCloseModal(false);
    setBudgetToClose(null);
    setSelectedCloseTarget(null);
  };

  const { t } = useTranslation();
  
  return (
    <div className="page-container">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total du budget : {formatCurrency(budgetsWithProgress.reduce((sum, b) => sum + b.amount, 0), settings.currency)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-outline flex items-center text-sm"
            title={t('budgets.resetToPlan', 'Reset to planned budgets')}
          >
            <Copy size={16} className="mr-2" />
            Réinitialiser selon le modèle
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1 focus:ring-0"
          >
            {months.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>
      
      <section className="mb-20">
        {budgetsWithProgress.length > 0 ? (
          <div className="space-y-4">
            {budgetsWithProgress.map((budget) => {
              const categoryNames = budget.budgetCategories || [];
              const categoryBadges = categoryNames.slice(0, 3).map((catName: string) => {
                const cat = categories.find((c) => c.name === catName);
                return cat ? (
                  <div
                    key={catName}
                    className="w-6 h-6 rounded-full mr-1 flex items-center justify-center"
                    style={{ backgroundColor: cat.color + '30' }}
                    title={catName}
                  >
                    <span style={{ color: cat.color, fontSize: 12 }}>{catName.charAt(0)}</span>
                  </div>
                ) : null;
              });
              const extraCount = categoryNames.length - 3;
              let extraBadge = null;
              if (extraCount > 0) {
                const extraNames = categoryNames.slice(3).join(', ');
                extraBadge = (
                  <div
                    className="w-6 h-6 rounded-full mr-1 flex items-center justify-center bg-gray-300 text-gray-700 text-xs cursor-pointer"
                    title={extraNames}
                  >
                    +{extraCount}
                  </div>
                );
              }
              const isOverBudget = budget.remaining < 0;
              const isFinished = budget.remaining === 0;
              return (
                <Link 
                  key={budget.id} 
                  to={`/budgets/${budget.id}`}
                  className="card block hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="flex flex-row mr-2">{categoryBadges}{extraBadge}</div>
                      <span className="font-medium">
                        {budget.name || categoryNames.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFinished ? (
                        <div className="flex items-center text-gray-400">
                          <span className="text-sm font-medium">{t('budgets.finished', 'Finished')}</span>
                        </div>
                      ) : isOverBudget && (
                        <div className="flex items-center text-warning-500">
                          <AlertTriangle size={16} className="mr-1" />
                          <span className="text-sm font-medium">{t('budgets.overBudget', 'Over budget')}</span>
                          <button
                            className="ml-2 btn-outline text-xs px-2 py-1 flex items-center"
                            title={t('budgets.balance', 'Équilibrer')}
                            onClick={e => { e.preventDefault(); handleBalanceClick(budget); }}
                          >
                            <Scale size={16} />
                          </button>
                        </div>
                      )}
                      {/* Bouton Clôturer */}
                      {!isFinished && !isOverBudget && (
                        <button
                          className="ml-2 btn-outline text-xs px-2 py-1 flex items-center"
                          title={t('budgets.close', 'Clôturer le budget')}
                          onClick={e => { e.preventDefault(); handleCloseClick(budget); }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      Dépensé : {formatCurrency(budget.spent, settings.currency)}
                    </span>
                    {!isFinished && (
                      <span className={`font-medium ${
                        isOverBudget
                          ? 'text-warning-500'
                          : 'text-green-500'
                      }`}>
                        {isOverBudget ? 'Dépassé de ' : 'Restant : '}
                        {formatCurrency(
                          isOverBudget ? -budget.remaining : budget.remaining, 
                          settings.currency
                        )}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                    <div
                      className={`h-2.5 rounded-full ${
                        isOverBudget
                          ? 'bg-warning-500'
                          : isFinished
                            ? 'bg-gray-400'
                            : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {formatCurrency(budget.spent, settings.currency)} sur {formatCurrency(budget.amount, settings.currency)}
                    </span>
                    <span>{Math.round(budget.percentage)}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-12">
            <div className="text-center mb-4">
              <div className="text-gray-400 mb-2">
                <Filter size={48} />
              </div>
              <h3 className="text-lg font-medium mb-1">Aucun budget trouvé</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Commencez par créer un budget pour vos dépenses
              </p>
            </div>
            <div className="space-y-2">
              <Link to="/budgets/add" className="btn-primary flex items-center">
                <Plus size={18} className="mr-2" />
                Créer un budget
              </Link>
              <Link to="/budgets/planned" className="btn-outline flex items-center">
                <Copy size={18} className="mr-2" />
                Gérer les budgets planifiés
              </Link>
            </div>
          </div>
        )}
      </section>
      
      <div className="fixed bottom-20 right-4 flex flex-col space-y-2">
        <Link
          to="/budgets/planned"
          className="bg-accent-600 text-white rounded-full p-4 shadow-lg hover:bg-accent-700 transition-all"
          aria-label="Manage planned budgets"
        >
          <ClipboardList size={24} />
        </Link>
        <Link
          to="/budgets/add"
          className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-all"
          aria-label="Add budget"
        >
          <Plus size={24} />
        </Link>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Réinitialiser les budgets mensuels ?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Cela va réinitialiser les budgets du mois en cours selon le modèle planifié. Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="btn-outline"
                onClick={() => setShowResetConfirm(false)}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleResetBudgets}
              >
                Réinitialiser selon le modèle
              </button>
            </div>
          </div>
        </div>
      )}

      {showBalanceModal && overBudgetToBalance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Équilibrer le budget</h3>
            <p className="mb-4">Sélectionnez un budget à débiter pour couvrir le dépassement de <b>{formatCurrency(Math.abs(overBudgetToBalance.remaining), settings.currency)}</b> :</p>
            <div className="space-y-2 mb-4">
              {budgetsWithProgress.filter(b => b.id !== overBudgetToBalance.id && b.remaining > 0).map(b => (
                <label key={b.id} className={`flex items-center p-2 rounded cursor-pointer ${selectedTargetBudget === b.id ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}>
                  <input
                    type="radio"
                    name="targetBudget"
                    value={b.id}
                    checked={selectedTargetBudget === b.id}
                    onChange={() => handleSelectTargetBudget(b.id)}
                    className="mr-2"
                  />
                  <span className="font-medium">{b.name || b.budgetCategories.join(', ')}</span>
                  <span className="ml-auto text-xs text-gray-500">Restant : {formatCurrency(b.remaining, settings.currency)}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button className="btn-outline" onClick={() => setShowBalanceModal(false)}>Annuler</button>
              <button className="btn-primary" disabled={!selectedTargetBudget} onClick={handleConfirmBalance}>Équilibrer</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && budgetToClose && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Clôturer le budget</h3>
            <p className="mb-4">Voulez-vous reverser le reste de <b>{formatCurrency(budgetToClose.remaining, settings.currency)}</b> sur un autre budget ? (optionnel)</p>
            <div className="space-y-2 mb-4">
              {budgetsWithProgress.filter(b => b.id !== budgetToClose.id && b.remaining > 0).map(b => (
                <label key={b.id} className={`flex items-center p-2 rounded cursor-pointer ${selectedCloseTarget === b.id ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}>
                  <input
                    type="radio"
                    name="closeTargetBudget"
                    value={b.id}
                    checked={selectedCloseTarget === b.id}
                    onChange={() => handleSelectCloseTarget(b.id)}
                    className="mr-2"
                  />
                  <span className="font-medium">{b.name || b.budgetCategories.join(', ')}</span>
                  <span className="ml-auto text-xs text-gray-500">Restant : {formatCurrency(b.remaining, settings.currency)}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button className="btn-outline" onClick={() => setShowCloseModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleConfirmClose}>Clôturer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;