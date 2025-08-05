import React, { useState } from 'react';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';

const ExpenseCategories = () => {
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: 'Office Supplies',
      description: 'General office materials and supplies',
      budget: 5000.00,
      spent: 2500.00,
      status: 'active'
    },
    // Add more sample data as needed
  ]);

  return (
    <div className="px-6 mt-5  py-8">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Expense Categories</h1>
        <p className="mt-1 text-xs text-gray-600">
          Manage expense categories and budgets
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search categories..."
          className="px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:border-transparent"
        />
        <button
          className="flex items-center px-4 py-2 text-xs text-white bg-[#E78D69] rounded-md hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaPlus className="h-3 w-3 mr-2" />
          New Category
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#02031E]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-xs text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-xs text-gray-900">{category.description}</td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  ${category.budget.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  ${category.spent.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  ${(category.budget - category.spent).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  <div className="flex space-x-3">
                    <button className="text-gray-600 hover:text-[#E78D69]">
                      <FaPencilAlt className="h-3 w-3" />
                    </button>
                    <button className="text-gray-600 hover:text-red-600">
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseCategories; 