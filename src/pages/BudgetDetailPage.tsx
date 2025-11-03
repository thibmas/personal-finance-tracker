import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { 
  formatCurrency, 
  formatDate, 
  getBudgetSpent, 
  getBudgetRemaining,
  getBudgetPercentage
} from '../utils/formatters';
import TransactionList from '../components/transactions/TransactionList';
import { useTranslation } from 'react-i18next';

const BudgetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { budgets, transactions, categories, settings, deleteBudget } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();
  
  const budget = budgets.find((b) => b.id === id);
  
  if (!budget) {
    return (
      <div className="page-container">
        <div className="card flex flex-col items-center justify-center py-8">
          <AlertTriangle size={48} className="text-warning-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('budget.notFound', 'Budget Not Found')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('budget.notFoundDesc', 'The budget you are looking for does not exist.')}
          </p>
          <Link to="/budgets" className="btn-primary">
            {t('budget.backToBudgets', 'Back to Budgets')}
          </Link>
        </div>
      </div>
    );
  }
  
  const budgetCategories = (budget.categories && Array.isArray(budget.categories)
    ? budget.categories
    : [budget.category]
  ).filter((c): c is string => typeof c === 'string');

  const spent = transactions
    .filter((t) => t.type === 'expense' && budgetCategories.includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);
  const remaining = budget.amount - spent;
  const percentage = Math.min((spent / budget.amount) * 100, 100);
  const isOverBudget = percentage >= 100;

  // Get related transactions
  const relatedTransactions = transactions
    .filter((t) => t.type === 'expense' && budgetCategories.includes(t.category))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const handleDelete = () => {
    deleteBudget(budget.id);
    navigate('/budgets');
  };
  
  return (
    <div className="page-container">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Détails du budget</h1>
        </div>
        <div className="flex">
          <Link
            to={`/budgets/${id}/edit`}
            className="btn-outline flex items-center mr-2"
          >
            <Edit size={18} className="mr-1" />
            {t('edit', 'Edit')}
          </Link>
          <button
            className="btn-outline text-red-500 dark:text-red-400 border-red-500 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash size={18} className="mr-1" />
            {t('delete', 'Delete')}
          </button>
        </div>
      </header>
      
      <div className="card mb-6 relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10"
          style={{ backgroundColor: (categories.find((c) => c.name === budgetCategories[0])?.color) || '#6B7280' }}
        />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2">{budget.name || budgetCategories.join(', ')}</h2>
            <div className="flex items-center">
              {budgetCategories.slice(0, 3).map((catName: string) => {
                const cat = categories.find((c) => c.name === catName);
                return cat ? (
                  <div
                    key={catName}
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                    style={{ backgroundColor: cat.color + '30' }}
                    title={catName}
                  >
                    <span style={{ color: cat.color }}>{catName.charAt(0)}</span>
                  </div>
                ) : null;
              })}
              {budgetCategories.length > 3 && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-gray-300 text-gray-700 text-xs cursor-pointer"
                  title={budgetCategories.slice(3).join(', ')}
                >
                  +{budgetCategories.length - 3}
                </div>
              )}
              <span className="text-gray-600 dark:text-gray-300">
                {budget.period === 'monthly' ? 'Mensuel' : 'Annuel'} budget
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(budget.amount, settings.currency)}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">
              Dépensé : {formatCurrency(spent, settings.currency)}
            </span>
            <span className={`font-medium ${isOverBudget ? 'text-warning-500' : 'text-green-500'}`}>
              {isOverBudget ? 'Dépassé de' : 'Restant'} : {formatCurrency(isOverBudget ? -remaining : remaining, settings.currency)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-1">
            <div
              className={`h-4 rounded-full ${
                isOverBudget ? 'bg-warning-500' : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {formatCurrency(spent, settings.currency)} sur {formatCurrency(budget.amount, settings.currency)}
            </span>
            <span>{Math.round(percentage)}%</span>
          </div>
        </div>
        
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date de début</h3>
            <p>{formatDate(budget.startDate)}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Période</h3>
            <p className="capitalize">{budget.period}</p>
          </div>
          
          {budget.notes && (
            <div className="col-span-2">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</h3>
              <p className="whitespace-pre-line">{budget.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Transactions liées</h2>
        {relatedTransactions.length > 0 ? (
          <TransactionList transactions={relatedTransactions} />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucune transaction liée trouvée</p>
          </div>
        )}
      </section>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Supprimer le budget ?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer ce budget ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </button>
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDetailPage;