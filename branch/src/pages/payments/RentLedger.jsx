import React, { useState, useEffect } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import axios from 'axios';
import { BASE_URL } from '../../config';

const RentLedger = () => {
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [propertyDetails, setPropertyDetails] = useState({
    propertyName: '',
    address: '',
    propertyType: '',
    lotSize: ''
  });
  const [tenantData, setTenantData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/rent-ledger`);
      setPropertyDetails(response.data.propertyDetails);
      setTenantData(response.data.tenantData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
      setError('Failed to load ledger data');
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/rent-ledger/export`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rent_ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting ledger:', err);
      alert('Failed to export ledger');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  return (
    <div className="px-6 mt-5 py-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Rent Ledger</h1>
        <div className="text-sm">
          <span className="text-gray-600">Date of report: </span>
          <span className="font-medium">{currentDate}</span>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white p-4 border border-gray-200 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Property Name: </span>
            <span className="font-medium">{propertyDetails.propertyName}</span>
          </div>
          <div>
            <span className="text-gray-600">Address: </span>
            <span className="font-medium">{propertyDetails.address}</span>
          </div>
          <div>
            <span className="text-gray-600">Property Type: </span>
            <span className="font-medium">{propertyDetails.propertyType}</span>
          </div>
          <div>
            <span className="text-gray-600">Lot Size: </span>
            <span className="font-medium">{propertyDetails.lotSize}</span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-xs text-white bg-[#E78D69] hover:bg-[#E78D69]/90 focus:outline-none focus:ring-2 focus:ring-[#E78D69] focus:ring-offset-2"
        >
          <FaFileDownload className="h-3 w-3 mr-2" />
          Export Ledger
        </button>
      </div>

      {/* Tenant Table */}
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#02031E]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white">Tenant name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white">Room</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white">Lease start date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white">Lease end date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white">Monthly rent</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white">Security deposit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white">Admin Fee</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white">Additional rent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenantData.map((tenant, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs text-gray-900">{tenant.tenantName}</td>
                <td className="px-4 py-2 text-xs text-gray-900">{tenant.room}</td>
                <td className="px-4 py-2 text-xs text-gray-900">{tenant.leaseStartDate}</td>
                <td className="px-4 py-2 text-xs text-gray-900">{tenant.leaseEndDate}</td>
                <td className="px-4 py-2 text-xs text-gray-900 text-right">${tenant.monthlyRent.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs text-gray-900 text-right">${tenant.securityDeposit.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs text-gray-900 text-right">${tenant.adminFee.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs text-gray-900 text-right">${tenant.additionalRent.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{tenant.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RentLedger; 