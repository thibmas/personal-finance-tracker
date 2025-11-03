import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';

interface AddTransactionPageProps {
  type: 'expense' | 'income';
}

const AddTransactionPage: React.FC<AddTransactionPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const { addTransaction, categories, settings } = useData();
  const { t } = useTranslation();
  
  const filteredCategories = categories.filter(
    (category) => category.type === type || category.type === 'both'
  ).sort((a, b) => a.name.localeCompare(b.name));
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: filteredCategories[0]?.name || '',
    description: '',
    notes: '',
    type,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.date || !formData.category || !formData.description) {
      return;
    }
    
    addTransaction({
      ...formData,
      amount: parseFloat(formData.amount),
    });
    
    navigate(`/${type}s`);
  };
  
  return (
    <div className="page-container">
      <header className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {type === 'expense' ? 'Ajouter une dépense' : 'Ajouter un revenu'}
        </h1>
      </header>
      
      <form onSubmit={handleSubmit} className="animate-fade-in">
        <div className="card mb-6">
          <div className="input-group">
            <label htmlFor="amount" className="input-label">
              Montant ({settings.currency})
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="date" className="input-label">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="category" className="input-label">
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full"
              required
            >
              <option value="" disabled>
                Sélectionnez une catégorie
              </option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="input-group">
            <label htmlFor="description" className="input-label">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder={type === 'expense' ? t('transaction.expensePlaceholder', 'e.g., Grocery shopping') : t('transaction.incomePlaceholder', 'e.g., Monthly salary')}
              value={formData.description}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          
          <div className="input-group mb-0">
            <label htmlFor="notes" className="input-label">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              name="notes"
              placeholder={t('transaction.notesPlaceholder', 'Add any additional details')}
              value={formData.notes}
              onChange={handleChange}
              className="w-full"
              rows={3}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full ${
            type === 'expense' ? 'btn-primary' : 'btn-secondary'
          } flex items-center justify-center text-lg`}
        >
          <Save size={20} className="mr-2" />
          {type === 'expense' ? 'Enregistrer la dépense' : 'Enregistrer le revenu'}
        </button>
      </form>
    </div>
  );
};

export default AddTransactionPage;