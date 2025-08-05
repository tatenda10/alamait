import React from 'react';

const FinancialTable = ({
  calculations,
  formatCurrency,
  isConsolidated,
  selectedBoardingHouses = [],
  boardingHouses = []
}) => {
  const { transformedData, totalRevenue, totalExpenses } = calculations;

  // Filter data based on selected boarding houses when in consolidated mode
  const filterDataByBoardingHouse = (items) => {
    // If not consolidated, show all items (single boarding house view)
    if (!isConsolidated) {
      return items;
    }
    
    // If consolidated but no specific boarding houses selected, show all
    if (selectedBoardingHouses.length === 0) {
      return items;
    }
    
    // Get boarding house names from IDs
    const selectedBoardingHouseNames = selectedBoardingHouses.map(id => {
      const house = boardingHouses.find(bh => bh.id === id);
      return house ? house.name : null;
    }).filter(Boolean);
    
    // Filter items by boarding house names
    return items.filter(item => 
      selectedBoardingHouseNames.includes(item.boarding_house_name)
    );
  };

  const filteredRevenue = filterDataByBoardingHouse(transformedData.revenue || []);
  const filteredExpenses = filterDataByBoardingHouse(transformedData.expenses || []);

  // Calculate filtered totals
  const filteredTotalRevenue = filteredRevenue.reduce((sum, item) => sum + (item.amount || 0), 0);
  const filteredTotalExpenses = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="w-full px-8 py-6">
      <div className="bg-white border border-gray-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="px-4 py-3 text-left font-bold text-gray-900 border-r border-gray-300">Account</th>
                {!isConsolidated && (
                  <th className="px-4 py-3 text-left font-bold text-gray-900 border-r border-gray-300">Boarding House</th>
                )}
                <th className="px-4 py-3 text-right font-bold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr className="border-b border-gray-800">
                <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-300">
                  REVENUE
                </td>
                {!isConsolidated && (
                  <td className="px-4 py-3 border-r border-gray-300"></td>
                )}
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatCurrency(isConsolidated && selectedBoardingHouses.length > 0 ? filteredTotalRevenue : totalRevenue || 0)}
                </td>
              </tr>
              
              {filteredRevenue.map(item => (
                <tr key={`revenue-${item.id}`} className="border-b border-gray-200">
                  <td className="px-6 py-2 text-gray-700 border-r border-gray-300">{item.account_name}</td>
                  {!isConsolidated && (
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-300">{item.boarding_house_name || 'N/A'}</td>
                  )}
                  <td className="px-4 py-2 text-right">
                    <span className="text-gray-900">{formatCurrency(item.amount || 0)}</span>
                  </td>
                </tr>
              ))}

              {/* Expenses Section */}
              <tr className="border-b border-gray-800">
                <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-300">
                  EXPENSES
                </td>
                {!isConsolidated && (
                  <td className="px-4 py-3 border-r border-gray-300"></td>
                )}
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatCurrency(isConsolidated && selectedBoardingHouses.length > 0 ? filteredTotalExpenses : totalExpenses || 0)}
                </td>
              </tr>
              
              {filteredExpenses.map(item => (
                <tr key={`expense-${item.id}`} className="border-b border-gray-200">
                  <td className="px-6 py-2 text-gray-700 border-r border-gray-300">{item.account_name}</td>
                  {!isConsolidated && (
                    <td className="px-4 py-2 text-gray-600 border-r border-gray-300">{item.boarding_house_name || 'N/A'}</td>
                  )}
                  <td className="px-4 py-2 text-right">
                    <span className="text-gray-900">{formatCurrency(item.amount || 0)}</span>
                  </td>
                </tr>
              ))}

              {/* Net Income Section */}
              <tr className="border-b-2 border-gray-800">
                <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-300">NET INCOME</td>
                {!isConsolidated && (
                  <td className="px-4 py-3 border-r border-gray-300"></td>
                )}
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatCurrency(
                    isConsolidated && selectedBoardingHouses.length > 0 
                      ? filteredTotalRevenue - filteredTotalExpenses
                      : (totalRevenue || 0) - (totalExpenses || 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialTable;