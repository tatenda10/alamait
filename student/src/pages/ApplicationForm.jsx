import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import BASE_URL from '../utils/api';

const ApplicationForm = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    gender: '',
    address: '',
    institution: '',
    medicalHistory: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    preferredMoveInDate: '',
    leaseStartDate: '',
    leaseEndDate: '',
    additionalNotes: '',
    roomId: searchParams.get('roomId') || '',
    bedId: searchParams.get('bedId') || '',
    bedNumber: searchParams.get('bedNumber') || '',
    price: searchParams.get('price') || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const applicationData = {
        student_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        national_id: formData.nationalId,
        gender: formData.gender,
        address: formData.address,
        institution: formData.institution,
        medical_history: formData.medicalHistory,
        room_id: parseInt(searchParams.get('roomId')),
        bed_id: searchParams.get('bedId') ? parseInt(searchParams.get('bedId')) : null,
        preferred_move_in_date: formData.preferredMoveInDate,
        lease_start_date: formData.leaseStartDate,
        lease_end_date: formData.leaseEndDate,
        emergency_contact_name: formData.emergencyContact,
        emergency_contact_phone: formData.emergencyPhone,
        emergency_contact_relationship: formData.emergencyRelationship,
        additional_notes: formData.additionalNotes
      };

      console.log('Sending application data:', applicationData);

      const response = await fetch(`${BASE_URL}/applications/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit application');
      }
      
      // Simulate processing time
      setTimeout(() => {
        setSubmitted(true);
        setSubmitting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application: ' + error.message);
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.firstName && 
           formData.lastName && 
           formData.email && 
           formData.phone &&
           formData.nationalId &&
           formData.gender &&
           formData.address &&
           formData.institution && 
           formData.emergencyContact && 
           formData.emergencyPhone &&
           formData.emergencyRelationship &&
           formData.leaseStartDate &&
           formData.leaseEndDate;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your application. We'll review it and get back to you within 2-3 business days.
            </p>
            <div className="space-y-3">
              <Link
                to="/"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors inline-block"
              >
                Browse More Rooms
              </Link>
              <Link
                to="/"
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors inline-block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=1080&fit=crop')`,
          filter: 'brightness(0.6)'
        }}
      ></div>
      
      {/* Light Overlay */}

      {/* Header */}
      <div className="relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">ALAMAIT</h1>
                <p className="text-sm text-white opacity-90">Feels like home</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-white hover:text-blue-300 font-medium transition-colors">Browse Rooms</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-100 bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all border border-white border-opacity-20">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center h-64 px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Application Form
          </h1>
          <p className="text-xl text-white opacity-90">
            Complete your accommodation application
          </p>
        </div>
      </div>

      {/* Application Form Section */}
      <div className="relative z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Application Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        National ID Number *
                      </label>
                      <input
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., 1234567890123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        placeholder="Enter your full address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Institution Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution/School *
                      </label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., University of Technology, High School Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Move-in Date *
                      </label>
                      <input
                        type="date"
                        name="preferredMoveInDate"
                        value={formData.preferredMoveInDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lease Start Date *
                      </label>
                      <input
                        type="date"
                        name="leaseStartDate"
                        value={formData.leaseStartDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lease End Date *
                      </label>
                      <input
                        type="date"
                        name="leaseEndDate"
                        value={formData.leaseEndDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical History & Conditions
                    </label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Please describe any medical conditions, allergies, or health concerns that we should be aware of. Leave blank if none."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This information helps us provide appropriate accommodation and emergency care if needed.
                    </p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship to Emergency Contact *
                      </label>
                      <select
                        name="emergencyRelationship"
                        value={formData.emergencyRelationship}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Information
                    </label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional information, special requests, or notes you'd like to share with us..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    disabled={!isFormValid() || submitting}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isFormValid() && !submitting
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting Application...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

            {/* Application Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h3>
              
              {formData.bedNumber && (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h4 className="font-medium text-teal-900 mb-2">Selected Accommodation</h4>
                    <div className="text-sm text-teal-800">
                      <div className="flex items-center mb-1">
                        <Squares2X2Icon className="h-4 w-4 mr-2" />
                        Bed {formData.bedNumber}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        ${formData.price}/month
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Application review (2-3 days)
                      </div>
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Confirmation email
                      </div>
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Contract signing
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>
                      By submitting this application, you agree to our terms and conditions. 
                      A deposit may be required upon approval.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
