// src/components/TaskDisplay.jsx

import React, { useEffect, useState } from 'react';
import { get } from '../services/ApiEndpoint'; // Adjust the import path as needed
const TaskDisplay = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await get('/task/assigned-tasks');
        if (response.data.success) {
          setTasks(response.data.tasks);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">


      <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliver By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigner Notes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliverer Notes</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task._id}>
              <td className="px-6 py-4 whitespace-nowrap">{task.Task}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(task.AssignDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">{task.AssignTo}</td>
              <td className="px-6 py-4 whitespace-nowrap">{task.DeliverBy}</td>
              <td className="px-6 py-4 whitespace-nowrap">{task.AssignerNotes}</td>
              <td className="px-6 py-4 whitespace-nowrap">{task.DelivererNotes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskDisplay;
