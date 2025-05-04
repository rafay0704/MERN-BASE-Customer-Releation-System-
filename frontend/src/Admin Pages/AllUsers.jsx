import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Logout } from '../redux/AuthSlice.jsx';
import { delet, get, post } from '../services/ApiEndpoint.jsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUserEdit } from 'react-icons/fa';
import { MdSearch } from 'react-icons/md';
import Modal from 'react-modal';
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    maxWidth: '600px',
    width: '100%',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  },
};

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const GetUsers = async () => {
      try {
        const { data } = await get('/api/admin/getuser');
        setUsers(data.users);
        setFilteredUsers(data.users);
        const uniqueDesignations = [...new Set(data.users.map(user => user.designation))];
        setDesignations(uniqueDesignations);
      } catch (error) {
        console.log(error);
      }
    };
    GetUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (searchTerm) result = result.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedDesignation) result = result.filter(user => user.designation === selectedDesignation);
    result = result.filter(user => user.status === statusFilter);

    setFilteredUsers(result);
  }, [searchTerm, selectedDesignation, users, statusFilter]);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { status } = await post(`/api/auth/toggle-status/${id}`, { status: newStatus });
      if (status === 200) {
        toast.success(`User status changed to ${newStatus}`);
        setUsers(users.map(user => user._id === id ? { ...user, status: newStatus } : user));
        setFilteredUsers(filteredUsers.map(user => user._id === id ? { ...user, status: newStatus } : user));
      }
    } catch (error) {
      toast.error("Failed to change user status");
      console.log("Error:", error);
    }
  };

  const handleDelet = async (id) => {
    try {
      const { status } = await delet(`/api/admin/deleteuser/${id}`);
      if (status === 200) {
        toast.success('User deleted successfully');
        setUsers(users.filter(user => user._id !== id));
        setFilteredUsers(filteredUsers.filter(user => user._id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.log('Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { status } = await post('/api/auth/logout');
      if (status === 200) {
        dispatch(Logout());
        navigate('/login');
        toast.info('Logged out successfully');
      }
    } catch (error) {
      toast.error('Failed to logout');
      console.log(error);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b  rounded-xl shadow-xl max-w-7xl mx-auto">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">All Users</h1>

      <div className="mb-6 flex justify-center space-x-4">
        {['active', 'inactive'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-6 py-2 rounded-lg ${statusFilter === status ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 border border-blue-300 rounded-lg w-full max-w-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MdSearch className="absolute right-3 top-2 text-gray-500" />
        </div>
        <select
          value={selectedDesignation}
          onChange={e => setSelectedDesignation(e.target.value)}
          className="p-2 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Designations</option>
          {designations.map(designation => (
            <option key={designation} value={designation}>{designation}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 text-center text-gray-700">
        <p>Showing {filteredUsers.length} {statusFilter}  {selectedDesignation || "Users"} </p>
      </div>

      <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <thead className="bg-green-200">
          <tr>
            {['Profile', 'Name', 'Email', 'Designation', 'Company Handling', 'View', 'Action'].map(header => (
              <th key={header} className="px-6 py-3 text-left text-gray-700 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user._id} className="border-b hover:bg-gray-50 transition duration-150">
              <td className="px-6 py-4">
                {user.profilePicture && (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePicture}`}
                    alt="Profile"
                    className="w-12 h-12 object-cover rounded-full border border-gray-200"
                  />
                )}
              </td>
              <td className="px-6 py-4">{user.name}</td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">{user.designation}</td>
              <td className="px-6 py-4">{user.companyHandling}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setModalIsOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition duration-150 mr-3"
                >
                  <FaUserEdit size={20} />
                </button>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleStatusToggle(user._id, user.status)}
                  className={`px-4 py-2 rounded-lg ${user.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                >
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
  <Modal
    isOpen={modalIsOpen}
    onRequestClose={() => setModalIsOpen(false)}
    style={customStyles}
  >
    <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">{selectedUser.name} Details</h2>
      <div className="space-y-2 text-sm text-gray-600">
        <div><strong className="text-gray-800">Email:</strong> {selectedUser.email}</div>
        <div><strong className="text-gray-800">Designation:</strong> {selectedUser.designation}</div>
        <div><strong className="text-gray-800">Status:</strong> {selectedUser.status}</div>
        <div><strong className="text-gray-800">Role:</strong> {selectedUser.role}</div>
        <div><strong className="text-gray-800">Company Handling:</strong> {selectedUser.companyHandling}</div>
        <div><strong className="text-gray-800">Date of Joining:</strong> {new Date(selectedUser.dateOfJoining).toLocaleDateString()}</div>
        <div><strong className="text-gray-800">Personal Phone#:</strong> {selectedUser.contactInformation}</div>
        <div><strong className="text-gray-800">Company Phone#:</strong> {selectedUser.companyPhone}</div>
        <div><strong className="text-gray-800">Home Address:</strong> {selectedUser.homeAddress}</div>
        <div><strong className="text-gray-800">User Created on:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
      </div>
      <div className="mt-4 flex justify-end space-x-4">
        <button
          onClick={() => setModalIsOpen(false)}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
)}


    </div>
  );
};

export default AllUsers;
