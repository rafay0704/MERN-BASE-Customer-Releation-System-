import React, { useState, useEffect } from "react";
import { post, get , put} from "../services/ApiEndpoint";
import moment from "moment";
import { toast } from 'react-toastify'; // Import toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import the styles for the toast
import * as XLSX from 'xlsx'; // Import the XLSX library for Excel file creation
import Confetti from "react-confetti"; // Import the Confetti component
import ClientModal from "../Modals/ClientModal";
const DailyClients = () => {
  const [batch, setBatch] = useState([]);
  const [batchDate, setBatchDate] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false); // State for confetti visibility

  const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [comments, setComments] = useState({});
  const [remainingClients, setRemainingClients] = useState(0);
  const [typing, setTyping] = useState({});  // This will hold typing state for each client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({}); // Data for the currently edited client
  const [modalType, setModalType] = useState(''); // 'status' or 'stage'

  const openModal = (type, client) => {
    setModalType(type);
    setModalData(client);
    setIsModalOpen(true);
};

const closeModal = () => {
    setIsModalOpen(false);
    setModalData({});
    setModalType('');
};

const handleModalSave = async (newValue) => {
    // Determine which field to update based on the modal type
    let updatedField;
    if (modalType === 'status') {
        updatedField = 'Status';
    } else if (modalType === 'language') {
        updatedField = 'Language';
    } else if (modalType === 'nationality') {
        updatedField = 'Nationality';
    } else if (modalType === 'industry') {
        updatedField = 'Industry';
    }

    // Ensure modalType is valid
    if (!updatedField) {
        console.error("Invalid modal type");
        return;
    }

    // Update the modal data with the new value
    const updatedClient = { ...modalData, [updatedField]: newValue.value };

    // Optimistic update - update clients and filteredClients arrays
    setClients(clients.map(client =>
        client.Mou_no === updatedClient.Mou_no ? updatedClient : client
    ));
  
    // Close the modal
    closeModal();

    // Send the updated data to the backend
    try {
        await put(`/api/css/client/${updatedClient.Mou_no}`, { [updatedField]: newValue.value });
    } catch (error) {
        console.error(`Error updating ${updatedField}:`, error);
    }
};

  const handleGenerateBatch = async () => {
    setLoadingGenerate(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await post("/api/css/generate-batch");
      const batchData = response.data.batch || [];
      setBatch(batchData);
      setBatchDate(new Date());
      const fullClientDetails = await fetchFullClientDetailsForBatch(batchData);
      setClients(fullClientDetails);
      setRemainingClients(fullClientDetails.length);  // Set remaining client count
      setSuccessMessage("Batch generated and client details fetched successfully!");
      setShowConfetti(true); // Show confetti after successful generation
      setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds

    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate batch");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const fetchLastBatch = async () => {
    setLoadingFetch(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await get("/api/css/last-batch");
      const batchData = response.data.batch || [];
      const batchDate = response.data.batchDate || null;
      setBatch(batchData);
      setBatchDate(batchDate);
      const fullClientDetails = await fetchFullClientDetailsForBatch(batchData);
      setClients(fullClientDetails);
      setRemainingClients(fullClientDetails.length);  // Set remaining client count
      setSuccessMessage("Last batch and client details fetched successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch last batch");
    } finally {
      setLoadingFetch(false);
    }
  };

  const fetchBatchesByDate = async () => {
    setLoadingFetch(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await post("/api/css/batches-by-date", { startDate, endDate });
      const batchData = response.data.batches || [];
      const allClientsInBatches = batchData.flatMap((batch) => batch.mous);
      setBatch(batchData);
      const fullClientDetails = await fetchFullClientDetailsForBatch(allClientsInBatches);
      setClients(fullClientDetails);
      setRemainingClients(fullClientDetails.length);  // Set remaining client count
      setSuccessMessage(
        `Batches and client details fetched from ${moment(startDate).format("MMMM Do YYYY")} to ${moment(endDate).format("MMMM Do YYYY")} successfully!`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch batches for selected date range");
    } finally {
      setLoadingFetch(false);
    }
  };

  // const fetchFullClientDetailsForBatch = async (batchMous) => {
  //   const clientDetailsPromises = batchMous.map(async (client) => {
  //     const response = await post("/api/css/client/details", {
  //       Mou_no: client.mou || client.Mou_no,
  //       CustomerName: client.customerName || client.CustomerName,
        
  //     });
  //     return response.data.clientDetails;
  //   });
  //   const fullClientDetails = await Promise.all(clientDetailsPromises);
  //   return fullClientDetails;
  // };
  const fetchFullClientDetailsForBatch = async (batchMous) => {
    const clientDetailsPromises = batchMous.map(async (client) => {
      const response = await post("/api/css/client/details", {
        Mou_no: client.mou || client.Mou_no,
        CustomerName: client.customerName || client.CustomerName,
      });
  
      const clientDetails = response.data.clientDetails;
  
      // Filter out clients that already have comments today
      const commentToday = clientDetails.LatestComments.some(comment =>
        moment(comment.timestamp).isSame(moment(), 'day')
      );
  
      // Only return clients that haven't been commented on today
      if (!commentToday) {
        return clientDetails;
      }
      return null; // Filter out clients with today's comment
    });
  
    const fullClientDetails = (await Promise.all(clientDetailsPromises)).filter(client => client !== null);
    return fullClientDetails;
  };
  

  const handleCommentChange = (clientMouNo, value) => {
    setComments((prev) => ({ ...prev, [clientMouNo]: value }));
    setTyping((prev) => ({ ...prev, [clientMouNo]: value })); // Update the typing state for the specific client
  };
  

  const handleAddComment = async (clientMouNo) => {
    const comment = comments[clientMouNo];
    if (!comment) return;

    try {
      const response = await post(`/api/css/client/${clientMouNo}/comment`, { comment });
      const updatedClient = response.data.client;


      
  //     // Update clients state to remove the completed client (the one whose comment was just added)
      setClients((prevClients) => 
        prevClients.filter((client) => client.Mou_no !== updatedClient.Mou_no)
      );
      // Update remaining client count
      setRemainingClients((prevCount) => prevCount - 1);

      // Reset the comment input for the completed client
      setComments((prev) => ({ ...prev, [clientMouNo]: "" }));

      // Show success toast
      toast.success("Comment added successfully!");

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    }
  };

  // const handleAddComment = async (clientMouNo) => {
  //   const comment = comments[clientMouNo];
  //   if (!comment) return;

  //   try {
  //     const response = await post(`/api/css/client/${clientMouNo}/comment`, { comment });
  //     const updatedClient = response.data.client;

  //     // Update clients state to remove the completed client (the one whose comment was just added)
  //     setClients((prevClients) => 
  //       prevClients.filter((client) => client.Mou_no !== updatedClient.Mou_no)
  //     );

  //     // Update remaining client count
  //     setRemainingClients((prevCount) => prevCount - 1);

  //     // Reset the comment input for the completed client
  //     setComments((prev) => ({ ...prev, [clientMouNo]: "" }));

  //     // Show success toast
  //     toast.success("Comment added successfully!");

  //   } catch (err) {
  //     setError(err.response?.data?.message || "Failed to add comment");
  //   }
  // };
  // const handleCommentChange = (clientMouNo, value) => {
  //   setComments((prev) => ({ ...prev, [clientMouNo]: value }));
  // };


  useEffect(() => {
    fetchLastBatch();
  }, []);

  const formatDateTime = (date) => {
    return date ? moment(date).format("MMMM Do YYYY") : "N/A";
  };

  const getLastCommentDetails = (latestComments) => {
    if (!latestComments || latestComments.length === 0) {
      return { comment: "No comments", name: "", timestamp: "" };
    }

    const lastComment = latestComments.reduce((latest, comment) =>
      new Date(comment.timestamp) > new Date(latest.timestamp) ? comment : latest
    );

    return {
      comment: lastComment.comment,
      name: lastComment.name,
      timestamp: lastComment.timestamp,

    };
  };

  const handleMediumChange = async (clientMouNo, newMedium) => {
    try {
      // Make an API call to update the status in the backend
      await put(`/api/css/client/${clientMouNo}/medium`, { medium: newMedium });
      
      // Update the client state to reflect the new status
      setClients((prevClients) =>
        prevClients.map((client) =>
          client.Mou_no === clientMouNo ? { ...client, medium: newMedium } : client
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update medium");
    }
  };

  const handleExportToExcel = () => {
    const data = clients.map(client => ({
           "Customer Name": client.CustomerName,
      "Date": formatDateTime(client.Date),
      "Visa Category": client.VisaCatagory,
      "Phone": `${client.Phone} / ${client.Mobile}`,
      "Email": client.Email,
      "Branch": client.BranchLocation,
      "Medium": client.medium,
      "Status": client.Status,
      "Last Comment": client.LatestComments && client.LatestComments.length > 0
        ? `${client.LatestComments[0].comment} by ${client.LatestComments[0].name} on ${formatDateTime(client.LatestComments[0].timestamp)}`
        : "No comments"
    }));
  
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
  
    XLSX.writeFile(wb, "ClientBatchData.xlsx");
  };
  
  return (
<div className="w-full h-screen p-4 sm:p-6 bg-white rounded-xl shadow-lg">
{showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

<h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">Daily Clients Batch</h1>

      <div className="flex justify-center mb-4 space-x-2">
        <button
          onClick={handleGenerateBatch}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:shadow-xl hover:from-indigo-600 hover:to-blue-600 transition duration-300"
          disabled={loadingGenerate}
        >
          {loadingGenerate ? "Processing..." : "Generate New Batch"}
        </button>
      </div>

      {/* <div className="flex justify-center mt-4">
        <button
          onClick={handleExportToExcel}
          className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-6 py-2 rounded-lg shadow hover:shadow-xl hover:from-teal-600 hover:to-green-600 transition duration-300"
        >
          Export to Excel
        </button>
      </div> */}

      {/* <div className="flex justify-center mb-4 space-x-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 transition duration-200 "
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 transition duration-200 "
        />
        <button
          onClick={fetchBatchesByDate}
          className="bg-gradient-to-r from-green-400 to-blue-400 text-white px-6 py-2 rounded-lg shadow hover:shadow-xl hover:from-blue-500 hover:to-green-500 transition duration-300"
          disabled={loadingFetch}
        >
          {loadingFetch ? "Loading..." : "Fetch Batches"}
        </button>
      </div> */}

      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
      {successMessage && <p className="text-green-600 text-center font-semibold">{successMessage}</p>}
      <div className="text-center mb-4">
        <p className="font-bold text-lg text-indigo-600">Remaining Clients: {remainingClients}</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-2">Batch Information</h2>
        <p className="text-center text-gray-500">
          <strong>Batch Date:</strong> {formatDateTime(batchDate)}
        </p>
        
        <table className="table-auto w-full mt-2 bg-white shadow-md rounded-lg text-xs">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
                            <th className="px-2 py-1 text-left">Customer Name</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Phone</th>
              <th className="px-2 py-1 text-left">Email</th>
              {/* <th className="px-2 py-1 text-left">Mobile</th> */}
              <th className="px-2 py-1 text-left">Branch</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Language</th>
              <th className="px-2 py-1 text-left">Medium</th>
              <th className="px-2 py-1 text-left">Last Comment</th>
              <th className="px-2 py-1 text-left">Comment</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => {
              const { comment, name, timestamp } = getLastCommentDetails(client.LatestComments);
              return (
                <tr key={index} className="border-t border-gray-200 text-sm">
                  <td className="px-2 py-1">{client.CustomerName}</td>
                  <td className="px-2 py-1">{formatDateTime(client.Date)}</td>
                  <td className="px-2 py-1">  {client.Phone} / {client.Mobile} </td>
                  <td className="px-2 py-1"> {client.Email} </td>
                  {/* <td className="px-2 py-1">{client.Mobile}</td> */}
                  <td className="px-2 py-1">{client.BranchLocation}</td>
                  {/* <td className="px-2 py-1">{client.Status}</td> */}
                  <td className="px-2 py-1 border-t text-center">
                        <button
                            onClick={() => openModal('status', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Status || "Add Status"}
                        </button>
                    </td>
                    <td className="px-2 py-1">{client.Language}</td>

                  <td className="px-2 py-1">
                    <select
                      value={client.medium}
                      onChange={(e) => handleMediumChange(client.Mou_no, e.target.value)}
                      className="border border-gray-300 rounded-lg px-1 py-1 focus:ring-2 focus:ring-blue-500 transition duration-200"
                    >
                      <option value="Emailed">Emailed</option>
                      <option value="Called & Emailed">Called & Emailed</option>
                      <option value="Emailed But Call No Response">Emailed & Call No Response</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {comment} <br />
                    <small className="text-gray-500">
                      <em>by {name} on {formatDateTime(timestamp)}</em>
                    </small>
                  </td>                 
                  
                  
                  <div className="relative">
  {/* Show tooltip only when typing for the specific client */}
  {typing[client.Mou_no] && (
    <div className="absolute bottom-full mb-2 left-0 bg-gray-700 text-white text-xs p-2 rounded-lg shadow-lg z-10 transition-all duration-300 opacity-100 transform translate-y-[-5px] max-w-full w-auto max-h-40 overflow-y-auto">
      {/* Tooltip with smooth transition */}
      {typing[client.Mou_no]}
    </div>
  )}

  <input
    type="text"
    value={comments[client.Mou_no] || ""}
    onChange={(e) => handleCommentChange(client.Mou_no, e.target.value)}
    placeholder="Add comment"
    className="border w-56 border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 transition duration-200"
  />
</div>




                  <td className="px-2 py-1">
                    <button
                      onClick={() => handleAddComment(client.Mou_no)}
                      className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition duration-200"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ClientModal
        isOpen={isModalOpen}
        modalData={modalData}
        modalType={modalType}
        closeModal={closeModal}
        handleModalSave={handleModalSave}
    />
    </div>
  );
};

export default DailyClients;
