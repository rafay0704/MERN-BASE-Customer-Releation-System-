import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { post } from '../services/ApiEndpoint.jsx';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyHandling, setCompanyHandling] = useState([]);
  const [homeAddress, setHomeAddress] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactInformation, setContactInformation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const companyHandlingOptions = [
    { value: 'VM UAE OFFICE', label: 'VM UAE OFFICE' },
    { value: 'MC UAE OFFICE', label: 'MC UAE OFFICE' },
    { value: 'Dev KARACHI OFFICE', label: 'Dev KARACHI OFFICE' },
    { value: 'Dev QATAR OFFICE', label: 'Dev QATAR OFFICE' },
    { value: 'DC - DEVISERS CONSULTANCY - (UAE OFFICE)', label: 'DC - DEVISERS CONSULTANCY - (UAE OFFICE)' },
    { value: 'ALL', label: 'ALL' },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('companyPhone', companyPhone);
    formData.append('companyHandling', JSON.stringify(companyHandling));
    formData.append('homeAddress', homeAddress);
    formData.append('designation', designation);
    formData.append('contactInformation', contactInformation);
    formData.append('dateOfJoining', dateOfJoining);

    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      const response = await post('/api/auth/register', formData);
      console.log(response.data);

      if (response.data.success) {
        toast.success('Registration successful!');
        navigate('/login'); // Redirect to the login page
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Registration failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-4xl p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Register</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="companyPhone" className="text-sm font-medium text-gray-700">Company Phone#:</label>
            <input
              type="text"
              id="companyPhone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="companyHandling" className="text-sm font-medium text-gray-700">Company Handling:</label>
            <Select
              id="companyHandling"
              isMulti
              options={companyHandlingOptions}
              value={companyHandling}
              onChange={(selectedOptions) => setCompanyHandling(selectedOptions)}
              className="mt-1"
            />
          </div>


          
          <div className="flex flex-col">
            <label htmlFor="homeAddress" className="text-sm font-medium text-gray-700">Home Address:</label>
            <input
              type="text"
              id="homeAddress"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="designation" className="text-sm font-medium text-gray-700">Designation:</label>
            <select
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select Designation</option>
              <option value="Manager">Manager</option>
              <option value="CSS">CSS</option>
              <option value="Business Planner">Business Planner</option>
              <option value="Software Engineer">Software Engineer </option>
              <option value="Trainer">Trainer</option>
              <option value="Submission Specialist">Submission Specialist</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="contactInformation" className="text-sm font-medium text-gray-700">Contact Information:</label>
            <input
              type="text"
              id="contactInformation"
              value={contactInformation}
              onChange={(e) => setContactInformation(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col ">
            <label htmlFor="dateOfJoining" className="text-sm font-medium text-gray-700">Date of Joining:</label>
            <input
              type="date"
              id="dateOfJoining"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex flex-col col-span-2">
            <label htmlFor="profilePicture" className="text-sm font-medium text-gray-700">Profile Picture:</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-500 border border-gray-300 rounded-md file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-md file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 col-span-2"
          >
            Register
          </button>
          <p className="text-sm text-gray-600 col-span-2">
            Already have an account?{' '}
            <Link to={'/login'} className="text-indigo-600 hover:text-indigo-700">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
