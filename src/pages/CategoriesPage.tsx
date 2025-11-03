import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import { useTranslation } from 'react-i18next';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#6B7280',
  });
  
  const filteredCategories = categories.filter(
    (category) => category.type === activeTab || category.type === 'both'
  );
  
  const sortedCategories = filteredCategories.slice().sort((a, b) => a.name.localeCompare(b.name));
  
  const handleAddCategory = () => {
    setFormData({
      name: '',
      type: activeTab,
      color: getRandomColor(),
    });
    setShowAddModal(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
    });
    setShowEditModal(true);
  };
  
  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteConfirm(true);
  };
  
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory({
      name: formData.name,
      type: formData.type as 'expense' | 'income' | 'both',
      color: formData.color,
    });
    setShowAddModal(false);
  };
  
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategory({
        id: selectedCategory.id,
        name: formData.name,
        type: formData.type as 'expense' | 'income' | 'both',
        color: formData.color,
      });
    }
    setShowEditModal(false);
  };
  
  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
    }
    setShowDeleteConfirm(false);
  };
  
  const getRandomColor = () => {
    const colors = [
      '#EF4444', // Red
      '#F97316', // Orange
      '#F59E0B', // Amber
      '#EAB308', // Yellow
      '#84CC16', // Lime
      '#22C55E', // Green
      '#10B981', // Emerald
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#0EA5E9', // Sky
      '#3B82F6', // Blue
      '#6366F1', // Indigo
      '#8B5CF6', // Violet
      '#A855F7', // Purple
      '#D946EF', // Fuchsia
      '#EC4899', // Pink
      '#F43F5E', // Rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <div className="page-container">
      <header className="flex items-center mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Catégories</h1>
      </header>
      
      <div className="flex mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 mr-2 rounded-lg ${
            activeTab === 'expense'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setActiveTab('expense')}
        >
          Dépenses
        </button>
        <button
          className={`px-4 py-2 mr-2 rounded-lg ${
            activeTab === 'income'
              ? 'bg-accent-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setActiveTab('income')}
        >
          Revenus
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {activeTab === 'expense' ? 'Catégories de dépenses' : 'Catégories de revenus'}
          </h2>
          <button
            onClick={handleAddCategory}
            className="btn-primary flex items-center text-sm py-1"
          >
            <Plus size={16} className="mr-1" />
            Ajouter une catégorie
          </button>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => (
              <div
                key={category.id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full mr-3 flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-white font-bold">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={t('categories.editCategory', `Edit ${category.name} category`)}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label={t('categories.deleteCategory', `Delete ${category.name} category`)}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-gray-500 dark:text-gray-400">
              {t('categories.noCategories', `No ${activeTab} categories found`)}
            </p>
          )}
        </div>
      </div>
      
      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Ajouter une catégorie</h3>
            <form onSubmit={handleSubmitAdd}>
              <div className="input-group">
                <label htmlFor="name" className="input-label">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="type" className="input-label">
                  Type de catégorie
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                  <option value="both">Les deux</option>
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="color" className="input-label">
                  Couleur
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 p-0 border-0 rounded-full mr-2"
                  />
                  <span className="flex-1 font-medium">{formData.color}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Modifier la catégorie</h3>
            <form onSubmit={handleSubmitEdit}>
              <div className="input-group">
                <label htmlFor="edit-name" className="input-label">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="edit-type" className="input-label">
                  Type de catégorie
                </label>
                <select
                  id="edit-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                  <option value="both">Les deux</option>
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="edit-color" className="input-label">
                  Couleur
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="edit-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 p-0 border-0 rounded-full mr-2"
                  />
                  <span className="flex-1 font-medium">{formData.color}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="card max-w-sm w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Supprimer la catégorie ?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer "{selectedCategory?.name}" ? Cette action est irréversible.
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
                onClick={handleConfirmDelete}
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

export default CategoriesPage;