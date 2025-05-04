import React, { useEffect, useState } from "react";
import { get, put, post, delet } from "../services/ApiEndpoint";
import { useParams , useNavigate } from "react-router-dom";
import TabNavigation from "./TabNavigation";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confettiGif from "./confetti.gif";
import ClientComments from "../Client-Details/ClientComments";
import ClientDocuments from "../Client-Details/ClientDocuments";
import ClientJourney from "../Client-Details/ClientJourney";
import ClientProfile from "../Client-Details/ClientProfile";
import ClientChecklist from "../Client-Details/ClientChecklist";
import DocumentsHighlightsEB from "../Client-Details/ClientChecklist";
import { FaArrowLeft } from 'react-icons/fa'; // Import the left arrow icon from react-icons

const Client = ({ userType }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0); // Default to the first tab
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [isCommitment, setIsCommitment] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [highlightExpiryDate, setHighlightExpiryDate] = useState("");
  const [checklist, setChecklist] = useState({});
  const [ebData, setEbData] = useState({ EB: "", Result: "", Date: "" }); // State for EB data
  const [showAddEB, setShowAddEB] = useState(false); // Add state for adding EB
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingEBId, setEditingEBId] = useState(null);
  const [customStatus, setCustomStatus] = useState(""); // State for custom status
  const [customIndustry, setCustomIndustry] = useState("");
  const [selectedTab, setSelectedTab] = useState("Comments");

  const [editingEBData, setEditingEBData] = useState({
    EB: "",
    Result: "",
    Date: "",
  });
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const [editingHighlightData, setEditingHighlightData] = useState({
    highlight: "",
    expiryDate: "",
  });
  const [documents, setDocuments] = useState([]); // State for documents

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState("CV");
  const [folders, setFolders] = useState([]);

  const [uploadMessage, setUploadMessage] = useState("Documents");
  const [selectedFiles, setSelectedFiles] = useState([]); // State for selected files
  const [profilePictures, setProfilePictures] = useState({});

  const currentStatus = client?.Status || "Status Not Supoorting"; // Default value if not available
  const currentStage =  client?.Stage || "Stage Not Supporting";
  const [selectedMainFolder, setSelectedMainFolder] = useState("");
  const [subFolderOptions, setSubFolderOptions] = useState([]);

  const handleMainFolderChange = (e) => {
    const folder = e.target.value;
    setSelectedMainFolder(folder);
    // Load subfolder options dynamically based on selected main folder
    setSubFolderOptions(Object.keys(documents[folder] || {}));
  };

  const handleSubFolderChange = (e) => {
    setSelectedFolder(e.target.value);
  };
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const endpoint =
          userType === "admin"
            ? `/api/admin/client/${id}`
            : `/api/css/client/${id}`;
        const response = await get(endpoint);
  
        console.log("Client details response:", response); // Debug log
        setClient(response.data.client);
        setFormData(response.data.client);
        setChecklist(response.data.client.Checklist);
  
        const names = response.data.client.LatestComments.map(
          (comment) => comment.name
        );
        console.log("Names array for profile pictures:", names); // Debug log
        fetchProfilePictures(names);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
  
    const fetchProfilePictures = async (names) => {
      if (!Array.isArray(names)) {
        console.error("Invalid names array:", names);
        return;
      }
  
      try {
        const pictures = {};
        const promises = names.map(async (name) => {
          console.log(`Fetching profile picture for: ${name}`); // Debug log
          const response = await get(`/api/auth/profile-picture/${name}`);
          console.log(`Profile picture response for ${name}:`, response); // Debug log
          if (response.data.success) {
            pictures[name] = `${import.meta.env.VITE_BACKEND_URL}${response.data.profilePicture}`;
          } else {
            console.error(`Failed to fetch profile picture for ${name}:`, response.data.message);
          }
        });
  
        // Wait for all profile pictures to be fetched
        await Promise.all(promises);
  
        // Set the profile pictures state after all are fetched
        setProfilePictures(pictures);
      } catch (error) {
        console.error("Error fetching profile pictures:", error);
      }
    };
  
    fetchClient();
    fetchDocuments(); // Fetch documents
  }, [id, userType]);
  
  // Handle Tab Toggle
  const handleTabChange = (tab) => setSelectedTab(tab);
  // Status and Stage options
  const statusOptions = [
    "Unresponsive",
    "Business Plan Required",
    "Switching In Progress",
    "Under Investment",
    "Orientation Done",
    "Orientation Not Done",
  "CV & Questionnaire Received",
  "BP Initial Draft Created",
  "BP Initial Draft Review Done",
  "BP Initial Draft Updated 1",
  "BP Initial Draft Review Verification Done",
  "BP Initial Draft Sent To Client",
  "BP Initial Draft Client Feedback",
  "BP Initial Draft Updated 2",
  "BP Initial Draft Approved By Client",
  "Supporting Documents Received",
  "BP Final Draft Created",
  "BP Final Draft Review Done",
  "BP Final Draft Updated 3",
  "BP Final Draft Review Verification Done",
  "BP Final Draft Sent To Client",
  "BP Final Draft Client Feedback",
  "BP Final Draft Updated 4",
  "BP Final Draft Approved By Client",
  "Training Sessions Completed",
  "Need To Submit Documents Received",
  "Endorsement Application Submitted",
  "Endorsement Application Rejected",
  "Endorsement Application Appeal",
    "Other",
  ];
  const stageOptions = [
    "Active",
    "Endorsed",
    "Visa Rejected",
    "Visa Granted",
    "Switched Out",
    "Court Case",
    "Refunded",
    "COS Issued"
  ];
  
  const industryOptions = [
    "Software",
    "Oil & Gas",
    "Other",

  ];

  // Function to handle expiry date change
  const handleExpiryDateChange = (e) => {
    setHighlightExpiryDate(e.target.value);
  };
  // Assuming client has a property named 'status' or 'currentStatus'

  const currentIndex = statusOptions.indexOf(currentStatus);
  const currentStageIndex = stageOptions.indexOf(currentStage)

  



  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "Status" && value === "Other") {
      // Clear custom status when "Other" is selected
      setCustomStatus("");
    }
    if (name === "Industry" && value === "Other") {
      // Clear custom status when "Other" is selected
      setCustomIndustry("");
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveClientDetails = async () => {
    try {
      const statusToSave = formData.Status === "Other" ? customStatus : formData.Status;
      const industryToSave = formData.Industry === "Other" ? customIndustry : formData.Industry;

      const updatedData = { ...formData, Status: statusToSave, Industry: industryToSave };

      const endpoint = userType === "admin"
        ? `/api/admin/client/${id}`
        : `/api/css/client/${id}`;
      await put(endpoint, updatedData);

      // After saving, update the client state with new data
      setClient((prevClient) => ({
        ...prevClient,
        ...updatedData, // Use the updated values here
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating client details:", error);
    }
  };

  // Function to save the checklist to the server
  const handleSaveChecklist = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`;

      await put(endpoint, { Checklist: checklist });

      // Directly update state without fetching again
      setChecklist((prevChecklist) => ({
        ...prevChecklist,
        ...checklist,
      }));

      console.log("Checklist saved successfully");
    } catch (error) {
      console.error("Error updating checklist:", error);
    }
  };

  // Function to handle checklist changes
  const handleChecklistChange = (item) => {
    setChecklist((prevChecklist) => ({
      ...prevChecklist,
      [item]: {
        value: !prevChecklist[item].value, // Toggle the checkbox value
        timestamp: new Date(), // Set the current time as the timestamp
      },
    }));
  };

  const handleHighlightChange = (e) => {
    setNewHighlight(e.target.value);
  };

  const handleAddHighlight = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}/critical-highlight`
          : `/api/css/client/${id}/critical-highlight`;

      console.log("Endpoint:", endpoint);
      console.log(
        "Highlight:",
        newHighlight,
        "Expiry Date:",
        highlightExpiryDate
      );

      const response = await post(endpoint, {
        criticalHighlight: newHighlight,
        expiryDate: highlightExpiryDate,
      });

      console.log("Response from add highlight:", response);

      setNewHighlight("");
      setHighlightExpiryDate("");
      setShowAddHighlight(false);

      const clientResponse = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );

      setClient(clientResponse.data.client);
      console.log("Updated Client:", clientResponse.data.client);
    } catch (error) {
      console.error("Error adding critical highlight:", error);
    }
  };

  const handleEBChange = (e) => {
    const { name, value } = e.target;
    setEbData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddEB = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}/submitted-eb`
          : `/api/css/client/${id}/submitted-eb`;
      await post(endpoint, ebData);
      setEbData({ EB: "", Result: "", Date: "" });
      setShowAddEB(false);
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error adding submitted EB:", error);
    }
  };

  // Function to handle comment edit change
  const handleCommentEditChange = (e) => {
    setEditingCommentText(e.target.value);
  };

  // Function to start editing a comment
  const handleEditComment = (commentId, commentText) => {
    setEditingCommentId(commentId);
    setEditingCommentText(commentText);
  };

  // Function to save the edited comment
  const handleSaveCommentEdit = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}/comment/${editingCommentId}`
          : `/api/css/client/${id}/comment/${editingCommentId}`;
      await put(endpoint, { comment: editingCommentText });
      setEditingCommentId(null);
      setEditingCommentText("");
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  // Function to delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}/comment/${commentId}`
          : `/api/css/client/${id}/comment/${commentId}`;
      await delet(endpoint);
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleEBEditChange = (e) => {
    const { name, value } = e.target;
    setEditingEBData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleHighlightEditChange = (e) => {
    const { name, value } = e.target;
    setEditingHighlightData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveEBEdit = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/clients/${id}/submittedEB/${editingEBId}`
          : `/api/css/clients/${id}/submittedEB/${editingEBId}`;
      await put(endpoint, editingEBData);
      setEditingEBId(null);
      setEditingEBData({ EB: "", Result: "", Date: "" });
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error updating submitted EB:", error);
    }
  };

  const handleSaveHighlightEdit = async () => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/clients/${id}/criticalHighlight/${editingHighlightId}`
          : `/api/css/clients/${id}/criticalHighlight/${editingHighlightId}`;

      // Verify that this payload matches what the backend expects
      await put(endpoint, {
        criticalHighlight: editingHighlightData.highlight,
        expiryDate: editingHighlightData.expiryDate,
      });

      setEditingHighlightId(null);
      setEditingHighlightData({ highlight: "", expiryDate: "" });

      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error updating critical highlight:", error);
    }
  };

  const handleDeleteEB = async (ebId) => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/clients/${id}/submittedEB/${ebId}`
          : `/api/css/clients/${id}/submittedEB/${ebId}`;
      await delet(endpoint);
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error deleting submitted EB:", error);
    }
  };

  const handleDeleteHighlight = async (highlightId) => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/clients/${id}/criticalHighlight/${highlightId}`
          : `/api/css/clients/${id}/criticalHighlight/${highlightId}`;
      await delet(endpoint);
      const response = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(response.data.client);
    } catch (error) {
      console.error("Error deleting critical highlight:", error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFolderChange = (e) => {
    setSelectedFolder(e.target.value);
  };


  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => setUploadMessage(''), 5000);
      return () => clearTimeout(timer); // Cleanup on component unmount
    }
  }, [uploadMessage]);

  const handleUploadDocument = async () => {
    if (!selectedFile || !selectedMainFolder || !selectedFolder) {
      setUploadMessage("Please select a file, main folder, and subfolder.");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("folderName", selectedMainFolder);
    formData.append("subFolderName", selectedFolder);

    try {
      const endpoint = userType === "admin"
        ? `/api/admin/client/${id}/upload`
        : `/api/css/client/${id}/upload`;

      await post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadMessage("Document uploaded successfully.");
      fetchDocuments();
      setSelectedFile(null);
      setSelectedMainFolder("");
      setSelectedFolder("");
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadMessage("Error uploading document.");
    }
  };


  const fetchDocuments = async () => {
    try {
      const endpoint = userType === "admin"
        ? `/api/admin/client/${id}/documents`
        : `/api/css/client/${id}/documents`;
      const response = await get(endpoint);
      setDocuments(response.data.folders);
      // console.log(response.data)
      console.log(response.data);  // Check what is inside the response
console.log(response.data.folders);  // Check the structure of the 'folders' data

    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleCopyFiles = async () => {
    if (selectedFiles.length === 0 || !selectedMainFolder || !selectedFolder) {
      setUploadMessage("Please select files, a main folder, and a subfolder.");
      return;
    }

    try {
      const response = await post(`/api/css/client/${id}/copy-files`, {
        selectedFiles,
        targetFolder: selectedMainFolder,
        subFolderName: selectedFolder,
      });

      setUploadMessage(response.data.message);
      setSelectedFiles([]);
      setSelectedMainFolder("");
      setSelectedFolder("");
      fetchDocuments();
    } catch (error) {
      console.error("Error copying files:", error);
      setUploadMessage("Error copying files.");
    }
  };



  const handleAddSubmission = async () => {
    try {
      const response = await post(`/api/css/client/${id}/createSubmission`);
      console.log(response); // Log the response to verify the structure

      // Assuming the response has a `folderPath` property that holds the created folder structure
      if (response.status === 201) {
        // Fetch documents again to update the folder list immediately
        fetchDocuments();
        setUploadMessage(response.data.message); // Display the success message returned by the backend
      } else {
        setUploadMessage("Failed to create submission folders.");
      }
    } catch (error) {
      console.error("Error creating submission folders:", error);
      setUploadMessage("Error creating submission folders.");
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleDownloadSelectedFiles = () => {
    if (selectedFiles.length === 0) {
      setUploadMessage("Please select files to download.");
      return;
    }

    try {
      selectedFiles.forEach((fileName) => {
        window.open(`${import.meta.env.VITE_BACKEND_URL}/api/documents/${fileName}`, "_blank");
      });

      setUploadMessage("Selected files are downloading...");  // Success message

    } catch (error) {
      console.error("Error downloading files:", error);
      setUploadMessage("Error downloading files.");  // Error message
    }
  };


  const handleCopyPrompt = async () => {
    try {
      const response = await get(`/api/css/client/${id}/summary-prompt`);

      if (response.data.success) {
        const promptText = response.data.prompt;

        // Create a temporary textarea element to hold the prompt text
        const textArea = document.createElement("textarea");
        textArea.value = promptText; // Set the text value to be copied
        document.body.appendChild(textArea); // Append to body (hidden)

        // Select and copy the text from the textarea
        textArea.select();
        document.execCommand("copy"); // Legacy method for copying text

        // Remove the textarea from the document
        document.body.removeChild(textArea);

        // Show success toast message
        toast.success("Prompt copied to clipboard! You can paste it where needed.");
      } else {
        // Show error toast if fetching prompt failed
        toast.error("Failed to fetch prompt.");
      }
    } catch (error) {
      console.error("Error fetching prompt:", error);
      // Show error toast if an error occurred
      toast.error("An error occurred while copying the prompt.");
    }
  };





  const handleAddCommentOrCommitment = async () => {
    try {
      const endpoint = isCommitment
        ? userType === "admin"
          ? `/api/admin/client/${id}/commitments`
          : `/api/css/client/${id}/commitments`
        : userType === "admin"
          ? `/api/admin/client/${id}/comment`
          : `/api/css/client/${id}/comment`;

      const data = isCommitment
        ? { commitment: newComment, deadline: newDeadline, name: userType }
        : { comment: newComment };

      await post(endpoint, data);
      setNewComment("");
      setNewDeadline("");
      setIsCommitment(false);

      const updatedClient = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(updatedClient.data.client);
    } catch (error) {
      console.error("Error adding comment or commitment:", error);
    }
  };

  const handleToggleCommitmentStatus = async (commitmentId, currentStatus) => {
    try {
      const endpoint =
        userType === "admin"
          ? `/api/admin/client/${id}/commitments/${commitmentId}`
          : `/api/css/client/${id}/commitments/${commitmentId}`;

      const newStatus = currentStatus === "done" ? "not done" : "done";
      await put(endpoint, { status: newStatus });

      const updatedClient = await get(
        userType === "admin"
          ? `/api/admin/client/${id}`
          : `/api/css/client/${id}`
      );
      setClient(updatedClient.data.client);
    } catch (error) {
      console.error("Error updating commitment status:", error);
    }
  };


   // Function to toggle the status of the highlight
   const handleStatusToggle = async (highlightId, currentStatus) => {
    try {
      const newStatus = currentStatus === "catered" ? "not catered" : "catered";

      // Make the PUT request to update the critical highlight status
      const response = await put(`/api/css/client/${id}/critical-highlight/${highlightId}/status`, { status: newStatus });
      if (response.data.success) {
        // Fetch updated client data after status change
        const updatedClient = await get(`/api/css/client/${id}`);
        setClient(updatedClient.data.client);
      } else {
        // Handle failure if needed
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleBackClick = () => {
    navigate(-1);  // This will navigate to the previous page
  };

  if (!client)
    return <div className="text-center text-gray-600">Loading...</div>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
     <button
  onClick={handleBackClick}
  className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-2 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
>
<FaArrowLeft /> {/* Render the back arrow icon */}
</button>

      <button
        onClick={handleCopyPrompt}
        className="bg-blue-500 text-white mt-20 p-2 rounded absolute top-4 right-4"
      >
        Copy Summary
      </button>
      <TabNavigation
        tabs={["Client Details", "Comments", "Documents", "Current Journey"]}
        selectedTab={activeTab} // Pass the current active tab index
        onSelectTab={(index) => setActiveTab(index)} // Set the active tab based on index
      />

      {activeTab === 0 && (
        <div className="flex">
          <ClientProfile
            client={client}
            statusOptions={statusOptions}
            stageOptions={stageOptions}
            isEditing={isEditing}
            formData={formData}
            handleChange={handleChange}
            handleSaveClientDetails={handleSaveClientDetails}
            setIsEditing={setIsEditing}
            customStatus={customStatus}
            setCustomStatus={setCustomStatus}
            industryOptions={industryOptions}
            customIndustry={customIndustry}
            setCustomIndustry={setCustomIndustry}
          />


          <div className="w-1/2 p-6 border border-gray-300 rounded-lg shadow-md bg-white ml-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Documents , Highlights & Submitted Endorsement
            </h2>



            <div className="space-y-2">
              <div>
                <ul className="list-disc pl-5 mt-2">
                  {Object.keys(checklist).map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      {/* Conditionally render the checkbox only for items other than 'ChecklistCompleted' */}
                      {item !== "ChecklistCompleted" && (
                        <input
                          type="checkbox"
                          checked={checklist[item].value || false}
                          onChange={() => handleChecklistChange(item)}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                      )}
                      <span
                        className={`ml-2 ${checklist[item].value && item !== "ChecklistCompleted"
                            ? "line-through text-gray-500"
                            : ""
                          }`}
                      >
                        {item === "ChecklistCompleted" ? (
                          // Display only the label 'Checklist Completed' with no value (Yes/No)
                          "Checklist Completed"
                        ) : (
                          item
                        )}
                      </span>
                      {/* Display the timestamp */}
                      {checklist[item].timestamp && (
                        <span className="text-gray-600 text-sm ml-4">
                          Last updated: {new Date(checklist[item].timestamp).toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {checklist.finalTimestamp && (
                <div className="text-gray-600 text-sm mt-4">
                  All checklist items completed on:{" "}
                  {new Date(checklist.finalTimestamp).toLocaleString()}
                </div>
              )}
              <button
                onClick={handleSaveChecklist}
                className="mt-4 px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
              >
                Save Checklist
              </button>
            </div>



            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Submitted Endorsing Body
              </h3>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                {client.SubmittedEB &&
                  client.SubmittedEB.map((eb) => (
                    <li key={eb._id} className="mb-2">
                      {editingEBId === eb._id ? (
                        <div>
                          <select
                            name="EB"
                            value={editingEBData.EB}
                            onChange={handleEBEditChange}
                            className="block w-full p-3 border border-gray-300 rounded-lg"
                          >
                            <option value="Envestors Limited">Envestors Limited</option>
                            <option value="Innovator International">Innovator International</option>
                            <option value="UK Endorsing Services">UK Endorsing Services</option>
                          </select>
                          <select
                            name="Result"
                            value={editingEBData.Result}
                            onChange={handleEBEditChange}
                            className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
                          >
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <input
                            type="date"
                            name="Date"
                            value={editingEBData.Date}
                            onChange={handleEBEditChange}
                            className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={handleSaveEBEdit}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEBId(null)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{eb.EB}</div>
                          <div className="text-sm text-gray-500">
                            Result: {eb.Result}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date: {new Date(eb.Date).toLocaleDateString()}
                          </div>
                          {userType === 'admin' && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingEBId(eb._id);
                                  setEditingEBData({
                                    EB: eb.EB,
                                    Result: eb.Result,
                                    Date: eb.Date,
                                  });
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEB(eb._id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>


            <div className="mt-6">
              {showAddEB ? (
                <div className="mt-4">
                  <select
                    name="EB"
                    value={ebData.EB}
                    onChange={handleEBChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Endorsment Body</option>
                    <option value="Envestors Limited">Envestors Limited</option>
                    <option value="Innovator International">Innovator International</option>
                    <option value="UK Endorsing Services">UK Endorsing Services</option>
                  </select>
                  <select
                    name="Result"
                    value={ebData.Result}
                    onChange={handleEBChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
                  >
                    <option value="">Select Result</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <input
                    type="date"
                    name="Date"
                    value={ebData.Date}
                    onChange={handleEBChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleAddEB}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                    >
                      Add Endorsemnet Body
                    </button>
                    <button
                      onClick={() => setShowAddEB(false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddEB(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
                >
                  Add Endorsemnet Body
                </button>
              )}
            </div>
            {/* Highlighs */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Critical Highlights
              </h3>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                {client.CriticalHighlights &&
                  client.CriticalHighlights.map((highlight) => (
                    <li key={highlight._id} className="mb-2">
                      {editingHighlightId === highlight._id ? (
                        <div>
                          <select
                            name="highlight"
                            value={editingHighlightData.highlight}
                            onChange={handleHighlightEditChange}
                            className="block w-full p-3 border border-gray-300 rounded-lg"
                          >
                            <option value="Kids 18+">Kids 18+</option>
                            <option value="Bank Statments">Bank Statments</option>
                            <option value="Ilets Expiry">Ilets Expiry</option>
                            <option value="Process Timeline">
                              Process Timeline
                            </option>
                            <option value="Residency Visa Expiry">
                              Residency Visa Expiry
                            </option>
                          </select>
                          <input
                            type="date"
                            name="expiryDate"
                            value={editingHighlightData.expiryDate}
                            onChange={handleHighlightEditChange}
                            className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={handleSaveHighlightEdit}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingHighlightId(null)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{highlight.criticalHighlight}</div>
                          <div className="text-sm text-gray-500">
                            Expiry Date:{" "}
                            {new Date(highlight.expiryDate).toLocaleString()}
                            <div
            className="cursor-pointer mt-2"
            onClick={() => handleStatusToggle(highlight._id, highlight.status)}
          >
            {highlight.status === "catered" ? (
              <span className="text-green-600">✅ Catered</span>  // Tick icon for catered
            ) : (
              <span className="text-red-600">❌ Not Catered</span>  // Cross icon for not catered
            )}
          </div>
                          </div>
                        
                          {userType === 'admin' && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingHighlightId(highlight._id);
                                  setEditingHighlightData({
                                    highlight: highlight.criticalHighlight,
                                    expiryDate: highlight.expiryDate,
                                  });
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteHighlight(highlight._id)
                                }
                                className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>


            <div className="mt-6">
              {showAddHighlight ? (
                <div className="space-y-4">
                  <select
                    value={newHighlight}
                    onChange={handleHighlightChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Highlight Type</option>
                    <option value="Kids 18+">Kids 18+</option>
                    <option value="Bank Statements">Bank Statments</option>
                    <option value="Ilets Expiry">Ilets Expiry</option>
                    <option value="Process Timeline">Process Timeline</option>
                    <option value="Residency Visa Expiry">
                      Residency Visa Expiry
                    </option>
                  </select>
                  <input
                    type="datetime-local"
                    value={highlightExpiryDate}
                    onChange={handleExpiryDateChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleAddHighlight}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                    >
                      Add Highlight
                    </button>
                    <button
                      onClick={() => setShowAddHighlight(false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddHighlight(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
                >
                  Add Highlight
                </button>
              )}
            </div>
          </div>





        </div>
      )}

      {activeTab === 1 && (
        <ClientComments
          client={client}
          profilePictures={profilePictures}
          userType={userType}
          selectedTab={selectedTab}
          handleTabChange={handleTabChange}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          handleCommentEditChange={handleCommentEditChange}
          handleSaveCommentEdit={handleSaveCommentEdit}
          handleEditComment={handleEditComment}
          handleDeleteComment={handleDeleteComment}
          handleToggleCommitmentStatus={handleToggleCommitmentStatus}
          newComment={newComment}
          setNewComment={setNewComment}
          isCommitment={isCommitment}
          setIsCommitment={setIsCommitment}
          newDeadline={newDeadline}
          setNewDeadline={setNewDeadline}
          handleAddCommentOrCommitment={handleAddCommentOrCommitment}
          handleCopyPrompt={handleCopyPrompt}
        />
      )}

      {activeTab === 2 && (
        <ClientDocuments
          handleFileChange={handleFileChange}
          handleFolderChange={handleFolderChange}
          handleUploadDocument={handleUploadDocument}
          uploadMessage={uploadMessage}
          selectedFolder={selectedFolder}
          documents={documents}
          selectedFiles={selectedFiles}
          handleSelectFile={handleSelectFile}
          handleDownloadSelectedFiles={handleDownloadSelectedFiles}
          handleAddSubmission={handleAddSubmission}
          handleCopyFiles={handleCopyFiles}
          selectedMainFolder={selectedMainFolder}
          handleMainFolderChange={handleMainFolderChange}
          handleSubFolderChange={handleSubFolderChange}
          subFolderOptions={subFolderOptions}
        />
      )}



      {activeTab === 3 && (
        <ClientJourney
          statusOptions={statusOptions}
          currentIndex={currentIndex}
          stageOptions = {stageOptions}
          currentStageIndex = {currentStageIndex}
          profilePictures={profilePictures}
          client={client}
          confettiGif={confettiGif}
        />
      )}
    </div>
  );
};

export default Client;
