import React, { useEffect, useState } from 'react';
import { get } from '../services/ApiEndpoint'; // Import the 'get' method directly

const ClientTasks = () => {
  const [clientTasks, setClientTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch client-wise tasks
  const fetchClientTasks = async () => {
    try {
      const response = await get('/tasks/client-wise');  // Use 'get' directly
      if (response.data.success) {
        setClientTasks(response.data.clientTasks);
      } else {
        setError('Failed to fetch client tasks');
      }
    } catch (err) {
      setError('An error occurred while fetching client tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Client-Wise Tasks</h2>
      {Object.entries(clientTasks).map(([mouNo, data]) => (
        <div key={mouNo} className="mb-6 border p-4 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Mou_No: {mouNo}</h3>
          <p className="mb-4">Customer Name: {data.clientDetails.CustomerName}</p>
          <p className="mb-4">Nationality: {data.clientDetails.Nationality}</p>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Task</th>
                <th className="py-2 px-4 border-b">Assigner Notes</th>
                <th className="py-2 px-4 border-b">Assign To</th>
                <th className="py-2 px-4 border-b">Deliverer Notes</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task._id}>
                  <td className="py-2 px-4 border-b">{task.Task}</td>
                  <td className="py-2 px-4 border-b">{task.AssignerNotes}</td>
                  <td className="py-2 px-4 border-b">{task.AssignTo}</td>
                  <td className="py-2 px-4 border-b">{task.DelivererNotes}</td>
                  <td className="py-2 px-4 border-b">{task.DelivererStatus || task.AssignerStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ClientTasks;
