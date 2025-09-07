import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../../context/Api';
import { useAuth } from '../../context/AuthContext';

const Students = () => {
  const { token } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState('');
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch students data
  const fetchStudents = async (boardingHouseId = null) => {
    try {
      setLoading(true);
      let url = `${BASE_URL}/students`;
      if (boardingHouseId) {
        url = `${BASE_URL}/students/boarding-house/${boardingHouseId}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Students data:', response.data);
      
      // Transform the data to match the table structure
      const transformedStudents = response.data.map(student => {
        // Handle different response structures
        let name, phone, boardingHouse, status;
        
        if (boardingHouseId) {
          // Raw data from getStudentsByBoardingHouse
          name = student.full_name || '-';
          phone = student.phone_number || '-';
          boardingHouse = boardingHouses.find(bh => bh.id === parseInt(boardingHouseId))?.name || 
                         student.boarding_house_name || '-';
          status = student.status || 'Inactive';
        } else {
          // Transformed data from getStudents
          name = student.first_name && student.last_name 
            ? `${student.first_name} ${student.last_name}`.trim()
            : student.full_name || '-';
          phone = student.phone_number || '-';
          boardingHouse = student.boarding_house_name || '-';
          status = student.status || 'Inactive';
        }
        
        return {
          id: student.id,
          name,
          phone_number: phone,
          boarding_house: boardingHouse,
          status
        };
      });
      
      setStudents(transformedStudents);
      setError('');
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch boarding houses
  const fetchBoardingHouses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding-houses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Boarding houses:', response.data); // Add logging to check response
      setBoardingHouses(response.data);
      // Don't set default boarding house, show all students initially
      fetchStudents();
    } catch (error) {
      console.error('Error fetching boarding houses:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBoardingHouses();
    }
  }, [token]);

  // Handle boarding house change
  const handleBoardingHouseChange = (value) => {
    setSelectedBoardingHouse(value);
    fetchStudents(value);
  };

  // Filter students by search term only (boarding house filtering is done on backend)
  const filteredStudents = students.filter(student => {
    return searchTerm === '' || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.boarding_house?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle student deletion
  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`${BASE_URL}/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchStudents(); // Refresh the list
      } catch (error) {
        console.error('Error deleting student:', error);
        setError('Failed to delete student');
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Students</h1>
          <p className="text-xs text-gray-500">Manage all students</p>
        </div>
        <Link
          to="/dashboard/students/add"
          className="flex items-center px-4 py-2 text-xs text-white transition-colors"
          style={{ backgroundColor: '#f58020' }}
        >
          <FiPlus size={14} className="mr-2" />
          Add Student
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Boarding House Selection */}
      {boardingHouses.length > 0 && (
        <div className="bg-white p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-700">
                {boardingHouses.find(bh => bh.id === selectedBoardingHouse)?.name || 'All Boarding Houses'}
              </h2>
            </div>
            <select
              className="text-xs border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedBoardingHouse || ''}
              onChange={(e) => handleBoardingHouseChange(e.target.value)}
            >
              <option value="">All Boarding Houses</option>
              {boardingHouses.map(bh => (
                <option key={bh.id} value={bh.id}>
                  {bh.name} - {bh.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100">
              <FiDownload size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone Number</th>
                <th className="px-6 py-3 text-left">Boarding House</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="text-xs text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4">{student.name}</td>
                    <td className="px-6 py-4">{student.phone_number}</td>
                    <td className="px-6 py-4">{student.boarding_house}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
                        ${student.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          student.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link 
                        to={`/dashboard/students/${student.id}`}
                        className="inline-block text-gray-600 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <FiEye size={14} />
                      </Link>
                      <Link
                        to={`/dashboard/students/${student.id}/edit`}
                        className="inline-block text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit student"
                      >
                        <FiEdit2 size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete student"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;
