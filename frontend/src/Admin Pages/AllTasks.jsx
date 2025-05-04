import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get, put } from '../services/ApiEndpoint';
import { AiOutlineEdit, AiOutlineSave } from 'react-icons/ai';
import { MdTaskAlt } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [editTask, setEditTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState({
    DelivererNotes: '',
    DelivererStatus: '',
    AssignerStatus: '',
  });
  const [clientDetails, setClientDetails] = useState({});
  const [filter, setFilter] = useState({ AssignerStatus: '', DelivererStatus: '', Task: '' });
  const [search, setSearch] = useState('');

  const user = useSelector((state) => state.Auth.user);
  const userDesignation = user?.designation;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = userDesignation === 'CSS'
          ? await get('/api/task/assigned-tasks')
          : await get('/api/task/tasks');
        setTasks(response.data.tasks);

        const mouNos = [...new Set(response.data.tasks.flatMap(task => task.Mou_No))];
        const clientDetailsResponses = await Promise.all(
          mouNos.map(mouNo => get(`/api/task/client-details/${mouNo}`))
        );
        const clientDetailsMap = clientDetailsResponses.reduce((acc, { data }) => {
          if (data.success) {
            acc[data.client.Mou_no] = data.client;
          }
          return acc;
        }, {});

        setClientDetails(clientDetailsMap);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [userDesignation]);

  const handleEditClick = (task) => {
    setEditTask(task);
    setTaskDetails({
      DelivererNotes: task.DelivererNotes || '',
      DelivererStatus: task.DelivererStatus || '',
      AssignerStatus: task.AssignerStatus || '',
    });
  };

const handleSaveClick = async () => {
  try {
    const updateData = userDesignation === 'CSS'
      ? { AssignerStatus: taskDetails.AssignerStatus }
      : {
          DelivererNotes: taskDetails.DelivererNotes,
          DelivererStatus: taskDetails.DelivererStatus,
          AssignerStatus: taskDetails.AssignerStatus,
        };

    await put(`/api/task/tasks/${editTask._id}`, updateData);

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === editTask._id ? { ...task, ...updateData } : task
      )
    );

    setEditTask(null);
  } catch (error) {
    console.error('Error updating task:', error);
  }
};



  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return date.toLocaleDateString(undefined, options);
  };

  const filteredTasks = tasks.filter(task => 
    (filter.AssignerStatus ? task.AssignerStatus === filter.AssignerStatus : true) &&
    (filter.DelivererStatus ? task.DelivererStatus === filter.DelivererStatus : true) &&
    (filter.Task ? task.Task.toLowerCase().includes(filter.Task.toLowerCase()) : true) &&
    (search ? task.Mou_No.some(mouNo => clientDetails[mouNo]?.CustomerName.toLowerCase().includes(search.toLowerCase())) : true)
  );

  const statusCounts = {
    total: tasks.length,
    assignerPending: tasks.filter(task => task.AssignerStatus === 'Pending').length,
    deliverPending: tasks.filter(task => task.DelivererStatus === 'Pending').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 flex items-center text-blue-600">
        <MdTaskAlt className="mr-3 text-3xl" /> All Tasks
      </h1>
      
      {/* Status Boxes */}
      <div className="mb-6 flex space-x-4">
        <div className="bg-white p-4 rounded-lg shadow-md flex-1 text-center">
          <p className="text-2xl font-bold text-gray-700">{statusCounts.total}</p>
          <p className="text-gray-500">Total Tasks</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex-1 text-center">
          <p className="text-2xl font-bold text-gray-700">{statusCounts.assignerPending}</p>
          <p className="text-gray-500">Assigner Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex-1 text-center">
          <p className="text-2xl font-bold text-gray-700">{statusCounts.deliverPending}</p>
          <p className="text-gray-500">Deliverer Pending</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <FaSearch className="mr-2 text-gray-600" />
          <input
            type="text"
            placeholder="Search by Customer Name"
            className="border px-4 py-2 rounded-lg w-full md:w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex space-x-4">
          <select
            className="border px-4 py-2 rounded-lg"
            value={filter.AssignerStatus}
            onChange={(e) => setFilter({ ...filter, AssignerStatus: e.target.value })}
          >
            <option value="">All Assigner Status</option>
            <option value="Pending">Pending</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Done">Done</option>
          </select>
          <select
            className="border px-4 py-2 rounded-lg"
            value={filter.DelivererStatus}
            onChange={(e) => setFilter({ ...filter, DelivererStatus: e.target.value })}
          >
            <option value="">All Deliverer Status</option>
            <option value="Pending">Pending</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Done">Done</option>
          </select>
          <input
            type="text"
            placeholder="Filter by Task"
            className="border px-4 py-2 rounded-lg"
            value={filter.Task}
            onChange={(e) => setFilter({ ...filter, Task: e.target.value })}
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-x-hidden">
        <table className="w-full bg-white border border-gray-200 shadow-md rounded-lg text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">#</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Customer Name</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Branch Location</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Assign Date</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Mou No</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Task</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Assign By</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Deliver By</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Assigner Notes</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Deliverer Notes</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Assigner Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Deliverer Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <tr key={task._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">
                  {task.Mou_No.map(mouNo => clientDetails[mouNo]?.CustomerName || 'N/A').join(', ')}
                </td>
                <td className="px-4 py-2">
                  {task.Mou_No.map(mouNo => clientDetails[mouNo]?.BranchLocation || 'N/A').join(', ')}
                </td>
                <td className="px-4 py-2">{formatDateTime(task.AssignDate)}</td>
                <td className="px-4 py-2">
  {task.Mou_No.map((mou, index) => (
    <span key={index}>
      <Link to={`/client/${mou}`} className="text-blue-600 hover:text-blue-800">
        {mou}
      </Link>
      {index < task.Mou_No.length - 1 && ', '}
    </span>
  ))}
</td>
                <td className="px-4 py-2">{task.Task}</td>
                <td className="px-4 py-2">{task.AssignBy}</td>
                <td className="px-4 py-2">{task.DeliverBy}</td>
                <td className="px-4 py-2">{task.AssignerNotes}</td>
                <td className="px-4 py-2">{task.DelivererNotes}</td>
                <td className="px-4 py-2">{task.AssignerStatus}</td>
                <td className="px-4 py-2">{task.DelivererStatus}</td>
                <td className="px-4 py-2 flex items-center">
                  <button
                    onClick={() => handleEditClick(task)}
                    className="mr-2 text-blue-600 hover:text-blue-800"
                  >
                    <AiOutlineEdit className="text-xl" />
                  </button>
                  {editTask?._id === task._id && (
                    <button
                      onClick={handleSaveClick}
                      className="text-green-600 hover:text-green-800"
                    >
                      <AiOutlineSave className="text-xl" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {editTask && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3">
      <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
      {/* If user is CSS, only show AssignerStatus */}
      {userDesignation === 'CSS' ? (
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Assigner Status</label>
          <select
            className="border px-4 py-2 rounded-lg w-full"
            value={taskDetails.AssignerStatus}
            onChange={(e) => setTaskDetails({ ...taskDetails, AssignerStatus: e.target.value })}
          >
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Done">Done</option>
          </select>
        </div>
      ) : (
        // If user is not CSS, show Deliverer Notes and Deliverer Status
        <>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Deliverer Notes</label>
            <textarea
              className="border px-4 py-2 rounded-lg w-full"
              rows="4"
              value={taskDetails.DelivererNotes}
              onChange={(e) =>
                setTaskDetails({ ...taskDetails, DelivererNotes: e.target.value })
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Deliverer Status</label>
            <select
              className="border px-4 py-2 rounded-lg w-full"
              value={taskDetails.DelivererStatus}
              onChange={(e) =>
                setTaskDetails({ ...taskDetails, DelivererStatus: e.target.value })
              }
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </>
      )}
      <button
        onClick={handleSaveClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
      >
        Save
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default AllTasks;
