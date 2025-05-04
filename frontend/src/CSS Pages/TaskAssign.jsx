import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { get, post } from '../services/ApiEndpoint';

const TaskAssign = () => {
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [newTask, setNewTask] = useState({
    
    Task: '',
    AssignerNotes: '',
       AssignTo: '',
         AssignerStatus: '',
  
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await get('/api/css/my-clients');
        setClients(response.data.clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    

    fetchClients();
    
  }, []);

  const handleClientSelect = (selectedOptions) => {
    setSelectedClients(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const handleTaskChange = (selectedOption) => {
    setNewTask({ ...newTask, Task: selectedOption.value });
  };

  const handleAssignToChange = (selectedOption) => {
    setNewTask({ ...newTask, AssignTo: selectedOption.value });
  };

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/api/task/assign-task', { ...newTask, Mou_No: selectedClients });
      
      // Reset the newTask state to clear all form fields
      setNewTask({
        Task: '',
        AssignerNotes: '',
        AssignTo: '',
  
      });
  
      // Clear the selected clients
      setSelectedClients([]);
  

    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };
  

  const clientOptions = clients.map(client => ({
    value: client.Mou_no,
    label: `${client.CustomerName} (MOU No: ${client.Mou_no})`
  }));

  const taskOptions = [
    { value: 'Zoom Meeting With Client', label: 'Zoom Meeting With Client' },
    { value: 'Business Concept', label: 'Business Concept' },
    { value: 'New Business Plan', label: 'New Business Plan' },
    { value: 'Initial BP Review', label: 'Initial BP Review' },
    { value: 'Final BP Review', label: 'Final BP Review' },
    { value: 'Business Plan Update', label: 'Business Plan Update' },
    { value: 'Client Feedback/Suggestions', label: 'Client Feedback/Suggestions' },
    { value: 'Supporting Docs', label: 'Supporting Docs' },
    { value: 'PowerPoint Presentation', label: 'PowerPoint Presentation' },
    { value: 'Wireframes', label: 'Wireframes' },
    { value: 'Technical Document', label: 'Technical Document' },
    { value: 'EB Submission', label: 'EB Submission' },
    { value: 'EB Feedback', label: 'EB Feedback' },
    { value: 'Refusal/Appeal EB Response', label: 'Refusal/Appeal EB Response' },
    { value: 'Home Office Task', label: 'Home Office Task' },
    { value: 'BP Rework After Refusal', label: 'BP Rework After Refusal' },
  ];

  const assignToOptions = [
    { value: 'Business Planner', label: 'Business Planner' },
    { value: 'Software Developer', label: 'Software Developer' },
    { value: 'Review Specialist', label: 'Review Specialist' },
    { value: 'Submission Specialist', label: 'Submission Specialist' },
  ];
  
  
  
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Assignment</h1>
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-semibold mb-4">Assign a New Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
            <label className="block text-gray-700">Assign To:</label>
            <Select
              options={assignToOptions}
              onChange={handleAssignToChange}
              value={assignToOptions.find(option => option.value === newTask.AssignTo)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700">Task:</label>
            <Select
              options={taskOptions}
              onChange={handleTaskChange}
              value={taskOptions.find(option => option.value === newTask.Task)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700">Assigner Notes:</label>
            <textarea
              name="AssignerNotes"
              value={newTask.AssignerNotes}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
         
          <div>
            <label className="block text-gray-700">Select Clients:</label>
            <Select
              isMulti
              options={clientOptions}
              onChange={handleClientSelect}
              className="mt-1"
            />
          </div>
        </div>
        <button type="submit" className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Assign Task
        </button>
      </form>
    
    </div>
  );
};

export default TaskAssign;
