import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatCurrency, getTransactionsTotalByType } from '../utils/formatters';
import TransactionList from '../components/transactions/TransactionList';
import { FilterOptions } from '../types';
import { useTranslation } from 'react-i18next';

const IncomePage: React.FC = () => {
  const { transactions, categories, settings } = useData();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    startDate: '',
    endDate: '',
  });
  
  // Get income categories
  const incomeCategories = categories.filter(
    (category) => category.type === 'income' || category.type === 'both'
  );
  
  // Get income and filter them
  const incomes = transactions
    .filter((t) => t.type === 'income')
    .filter((t) => {
      // Search by description or category
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !t.category.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (filters.categories && filters.categories.length > 0 && 
          !filters.categories.includes(t.category)) {
        return false;
      }
      
      // Filter by date range
      if (filters.startDate && new Date(t.date) < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && new Date(t.date) > new Date(filters.endDate)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return String(a.id).localeCompare(String(b.id));
  })
  
  const totalIncome = getTransactionsTotalByType(incomes, 'income');
  
  const handleCategoryToggle = (category: string) => {
    setFilters((prevFilters) => {
      const categoryFilters = prevFilters.categories || [];
      
      if (categoryFilters.includes(category)) {
        return {
          ...prevFilters,
          categories: categoryFilters.filter((c) => c !== category),
        };
      } else {
        return {
          ...prevFilters,
          categories: [...categoryFilters, category],
        };
      }
    });
  };
  
  const clearFilters = () => {
    setFilters({
      categories: [],
      startDate: '',
      endDate: '',
    });
    setSearchTerm('');
  };
  
  return (
    <div className="page-container">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Revenus</h1>
        <div className="text-xl font-semibold text-green-500 dark:text-green-400">
          {formatCurrency(totalIncome, settings.currency)}
        </div>
      </header>
      
      <div className="mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2"
            placeholder="Rechercher un revenu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <button
            className="btn-outline flex items-center py-1 px-3 text-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Filtres {filters.categories?.length ? `(${filters.categories.length})` : ''}
          </button>
          
          {(filters.categories?.length || filters.startDate || filters.endDate) && (
            <button
              className="text-sm text-primary-600 dark:text-primary-400"
              onClick={clearFilters}
            >
              Effacer tout
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="card mb-4 animate-slide-up">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Catégories</h3>
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`py-1 px-3 text-sm rounded-full transition-colors ${
                      filters.categories?.includes(category.name)
                        ? 'bg-accent-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => handleCategoryToggle(category.name)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="input-label">
                  De
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="w-full"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="input-label">
                  À
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="w-full"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <section className="mb-20">
        {incomes.length > 0 ? (
          <TransactionList transactions={incomes} />
        ) : (
          <div className="card flex flex-col items-center justify-center py-12">
            <div className="text-center mb-4">
              <div className="text-gray-400 mb-2">
                <Filter size={48} />
              </div>
              <h3 className="text-lg font-medium mb-1">Aucun revenu trouvé</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || filters.categories?.length || filters.startDate || filters.endDate
                  ? 'Essayez de modifier vos filtres ou votre recherche'
                  : 'Commencez à suivre vos revenus'}
              </p>
            </div>
            <Link to="/income/add" className="btn-secondary flex items-center">
              <Plus size={18} className="mr-2" />
              Ajouter un revenu
            </Link>
          </div>
        )}
      </section>
      
      <Link
        to="/income/add"
        className="fixed bottom-20 right-4 bg-accent-600 text-white rounded-full p-4 shadow-lg hover:bg-accent-700 transition-all"
        aria-label="Ajouter un revenu"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};

export default IncomePage;