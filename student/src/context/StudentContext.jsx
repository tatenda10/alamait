import React, { createContext, useContext, useState } from 'react';

const StudentContext = createContext();

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

export const StudentProvider = ({ children }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [applicationData, setApplicationData] = useState(null);

  const value = {
    selectedRoom,
    setSelectedRoom,
    selectedBed,
    setSelectedBed,
    applicationData,
    setApplicationData
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};
