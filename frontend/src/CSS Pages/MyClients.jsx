import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, put, post } from '../services/ApiEndpoint';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import { MdFlag, MdPushPin } from "react-icons/md";
import Modal from 'react-modal';
import ClientModal from '../Modals/ClientModal';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import the styles for the toast
import DatePicker from 'react-datepicker';

Modal.setAppElement('#root'); // To avoid accessibility warnings

const MyClients = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusOptions, setStatusOptions] = useState([]);
    const [visaCategoryOptions, setVisaCategoryOptions] = useState([]);
    const [branchLocationOptions, setBranchLocationOptions] = useState([]);
    const [nationalityOptions, setNationalityOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({}); // Data for the currently edited client
    const [modalType, setModalType] = useState(''); // 'status' or 'stage'
    const [flagOptions] = useState([
        { value: 'red', label: 'Critical' },
        { value: 'yellow', label: 'Non Critical' },
        { value: 'green', label: 'Endorsed' }
    ]);
    const [comments, setComments] = useState({});
    const [isEditingDate, setIsEditingDate] = useState(null); // Track if a date is being edited
    const [selectedDate, setSelectedDate] = useState(null); // Track selected date for each client

    

    const [selectedFlags, setSelectedFlags] = useState([]);

    const user = useSelector((state) => state.Auth.user);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await get('/api/css/my-clients');
                let data = response.data.clients;

                // Sort clients to prioritize red-flagged clients and pinned clients
                data = data.sort((a, b) => {

                    // Then sort by PinnedStatus (pinned at top)
                    if (a.PinnedStatus === 'pinned' && b.PinnedStatus !== 'pinned') return -1;
                    if (a.PinnedStatus !== 'pinned' && b.PinnedStatus === 'pinned') return 1;

                    // Sort by Flag first (red at top)
                    if (a.Flag === "red" && b.Flag !== "red") return -1;
                    if (a.Flag !== "red" && b.Flag === "red") return 1;
                    
                    return 0;
                });

                setClients(data);
                setFilteredClients(data);

                // Extract unique filter options
                setStatusOptions(generateOptions(data, 'Status'));
                setVisaCategoryOptions(generateOptions(data, 'VisaCatagory'));
                setBranchLocationOptions(generateOptions(data, 'BranchLocation'));
                setNationalityOptions(generateOptions(data, 'Nationality'));
                setLanguageOptions(generateOptions(data, 'Language'));
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };

        fetchClients();
    }, []);
    const handleCommentChange = (clientMouNo, value) => {
        setComments((prev) => ({ ...prev, [clientMouNo]: value }));
    };
    const isValidDateFormat = (date) => {
        const regex = /^\d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
        return regex.test(date);
    };
    
    // Format date to "DD MMM YYYY" format (for display purposes)
    const formatDateToCustomFormat = (date) => {
        if (!date) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = new Date(date);
    
        const day = d.getDate().toString().padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
    
        return `${day} ${month} ${year}`;
    };
// Function to convert "DD MMM YYYY" format to ISO format (YYYY-MM-DD)
const convertToISODate = (date) => {
    if (!date) return '';
    const parts = date.split(' '); // Assuming "DD MMM YYYY" format
    const months = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];
    return `${year}-${month}-${day}`;
};

// Handle date change
const handleDateChange = async (clientId, date) => {
    // Format the date to 'DD MMM YYYY' format
    const formattedDate = date ? formatDateToCustomFormat(date) : '';

    // Optimistically update the state to reflect the change
    const updatedClients = clients.map(client =>
        client.Mou_no === clientId ? { ...client, Date: formattedDate } : client
    );

    // Update state immediately to reflect the changes in the UI
    setClients(updatedClients);
    setFilteredClients(updatedClients);

    try {
        // Make API call to update the date on the server
        const response = await put(`/api/css/client/${clientId}`, { Date: formattedDate });

        // Handle response and check success
        if (!response.success) {
            console.error("Error updating date:", response.message);
            // Revert the date update in the state if the API call fails
            setClients(clients);
            setFilteredClients(clients);
        }
    } catch (error) {
        console.error("Error during API call:", error);
        // Revert the date update in the state if the API call fails
        setClients(clients);
        setFilteredClients(clients);
    }
};

// Handle click on the date to enable editing
const handleClickDate = (clientId) => {
    setIsEditingDate(clientId); // Set the editing mode for the specific client
};

    




    const handleAddComment = async (clientMouNo) => {
        const comment = comments[clientMouNo];
        if (!comment) return;
    
        try {
            // Post comment to backend
            const response = await post(`/api/css/client/${clientMouNo}/comment`, { comment });
            const updatedClient = response.data.client; // Assuming the server responds with updated client
    
            // Update clients state optimistically
            setClients((prevClients) =>
                prevClients.map((client) =>
                    client.Mou_no === updatedClient.Mou_no
                        ? { ...client, LatestComments: updatedClient.LatestComments }
                        : client
                )
            );
    
            // Update filtered clients to reflect the new comment
            setFilteredClients((prevFilteredClients) =>
                prevFilteredClients.map((client) =>
                    client.Mou_no === updatedClient.Mou_no
                        ? { ...client, LatestComments: updatedClient.LatestComments }
                        : client
                )
            );
    
            // Reset the comment input for the completed client
            setComments((prev) => ({ ...prev, [clientMouNo]: "" }));
    
            // Show success toast
            toast.success("Comment added successfully!");
        } catch (err) {
            console.error("Error adding comment:", err);
            toast.error(err.response?.data?.message || "Failed to add comment");
        }
    };
    

    const generateOptions = (data, key) => {
        const uniqueOptions = [...new Set(data.map(client => client[key]))];
        return uniqueOptions.map(option => ({ value: option, label: option }));
    };

    const handleFilterChange = (selectedOptions, filterType) => {
        let newFilteredClients = clients;

        if (filterType === 'status') {
            const selectedStatuses = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedStatuses.length === 0 || selectedStatuses.includes(client.Status)
            );
        } else if (filterType === 'visaCategory') {
            const selectedVisaCategories = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedVisaCategories.length === 0 || selectedVisaCategories.includes(client.VisaCatagory)
            );
        } else if (filterType === 'branchLocation') {
            const selectedBranchLocations = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedBranchLocations.length === 0 || selectedBranchLocations.includes(client.BranchLocation)
            );
            
        } else if (filterType === 'language') {
            const selectedLanguages = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedLanguages.length === 0 || selectedLanguages.includes(client.Language)
            );
            
        }
        else if (filterType === 'nationality') {
            const selectedNationalities = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedNationalities.length === 0 || selectedNationalities.includes(client.Nationality)
            );
        } else if (filterType === 'flag') {
            const selectedFlagColors = selectedOptions.map(option => option.value);
            newFilteredClients = newFilteredClients.filter(client =>
                selectedFlagColors.length === 0 || selectedFlagColors.includes(client.Flag)
            );
            setSelectedFlags(selectedOptions);
        }

        setFilteredClients(newFilteredClients);
    };

 const handleFlagChange = async (clientId, newFlag) => {
    // Optimistic update
    setClients(clients.map(client =>
        client.Mou_no === clientId ? { ...client, Flag: newFlag } : client
    ));

    // Update the filtered clients to reflect the flag change immediately
    const updatedFilteredClients = filteredClients.map(client =>
        client.Mou_no === clientId ? { ...client, Flag: newFlag } : client
    );
    setFilteredClients(updatedFilteredClients);

    // Reapply sorting after the flag change
    const sortedClients = updatedFilteredClients.sort((a, b) => {
        // Sort by PinnedStatus (pinned at top)
        if (a.PinnedStatus === 'pinned' && b.PinnedStatus !== 'pinned') return -1;
        if (a.PinnedStatus !== 'pinned' && b.PinnedStatus === 'pinned') return 1;

        // Sort by Flag first (red at top)
        if (a.Flag === "red" && b.Flag !== "red") return -1;
        if (a.Flag !== "red" && b.Flag === "red") return 1;

        return 0;
    });

    setFilteredClients(sortedClients);

    try {
        await put(`/api/css/client/${clientId}`, { Flag: newFlag });
    } catch (error) {
        console.error("Error updating flag:", error);
        // Revert the optimistic update if necessary
        setClients(clients.map(client =>
            client.Mou_no === clientId ? { ...client, Flag: client.Flag } : client
        ));
    }
};


    const getFlagIcon = (client) => {
        const flagColors = { yellow: "text-yellow-600", red: "text-red-600", green: "text-green-600" };
        return (
            <MdFlag
                className={`${flagColors[client.Flag]} cursor-pointer`}
                title="Click to change flag"
                onClick={() => handleFlagChange(client.Mou_no, client.Flag === "red" ? "yellow" : "red")}
            />
        );
    };

    const handlePinToggle = async (clientId) => {
        try {
            // Optimistic update
            const updatedClients = clients.map(client =>
                client.Mou_no === clientId ? { ...client, PinnedStatus: client.PinnedStatus === 'pinned' ? '' : 'pinned' } : client
            );
            setClients(updatedClients);
            setFilteredClients(updatedClients);
    
            // Reapply sorting after pin status change
            const sortedClients = updatedClients.sort((a, b) => {
                // Then sort by PinnedStatus (pinned at top)
                if (a.PinnedStatus === 'pinned' && b.PinnedStatus !== 'pinned') return -1;
                if (a.PinnedStatus !== 'pinned' && b.PinnedStatus === 'pinned') return 1;
    
                // Sort by Flag first (red at top)
                if (a.Flag === "red" && b.Flag !== "red") return -1;
                if (a.Flag !== "red" && b.Flag === "red") return 1;
    
                return 0;
            });
    
            setFilteredClients(sortedClients);
    
            // Now make the backend request
            await put(`/api/css/client/${clientId}/toggle-pinned`);
        } catch (error) {
            console.error('Error toggling pin status:', error);
        }
    };
    

    const getPinIcon = (client) => {
        return (
            <MdPushPin
                className={`cursor-pointer ${client.PinnedStatus === 'pinned' ? 'text-blue-600' : 'text-gray-400'}`}
                title="Pin this client"
                onClick={() => handlePinToggle(client.Mou_no)}
            />
        );
    };

    const handleSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        setFilteredClients(clients.filter(client =>
            client.Mou_no.toString().includes(value) ||
            client.CustomerName.toLowerCase().includes(value) ||
            (client.Email && client.Email.toLowerCase().includes(value)) ||
            (client.Phone && client.Phone.includes(value))
        ));
    };

   

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
        setFilteredClients(filteredClients.map(client =>
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
    

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Customize this as needed for your format
    };
    const getLatestComment = (latestComments) => {
        if (latestComments && latestComments.length > 0) {
            // Sort by timestamp to get the most recent comment
            latestComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const latestComment = latestComments[0];
            return latestComment;
        }
        return null; // Return null if no comment exists
    };    
    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center">{user.name}'s Clients</h1>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by MOU, Customer Name, Email, or Phone"
                    className="p-2 border border-gray-300 rounded w-full"
                />
            </div>

            {/* Filter Options */}
            <div className="mb-4 flex gap-4">
                <Select
                    options={statusOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'status')}
                    placeholder="Filter by Status"
                    className="w-1/4"
                />
                <Select
                    options={visaCategoryOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'visaCategory')}
                    placeholder="Filter by Visa Category"
                    className="w-1/4"
                />
                <Select
                    options={branchLocationOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'branchLocation')}
                    placeholder="Filter by Branch"
                    className="w-1/4"
                />
                <Select
                    options={nationalityOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'nationality')}
                    placeholder="Filter by Nationality"
                    className="w-1/4"
                />
                <Select
                    options={flagOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'flag')}
                    value={selectedFlags}
                    placeholder="Filter by Flag"
                    className="w-1/4"
                />
                 <Select
                    options={languageOptions}
                    isMulti
                    onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'language')}
                    
                    placeholder="Filter by Language"
                    className="w-1/4"
                />
            </div>

            <div className="mb-4 text-lg">
                Showing {filteredClients.length} clients
            </div>

           {/* Clients Table */}
           <div className="overflow-x-auto max-w-full">                   
     <table className="min-w-full bg-white rounded-lg shadow-md text-xs">
        <thead className="bg-gray-200">
            <tr>
                <th className="px-2 py-1 border-b text-center">Pin</th>
                <th className="px-2 py-1 border-b text-center">Flag</th>
                <th className="px-2 py-1 border-b text-center">CustomerName</th>
                <th className="px-2 py-1 border-b text-center">Date</th>
                <th className="px-2 py-1 border-b text-center">Email</th>
                <th className="px-2 py-1 border-b text-center">Comment</th>
                <th className="px-2 py-1 border-b text-center">Language</th>
                <th className="px-2 py-1 border-b text-center">Nationality</th>
                <th className="px-2 py-1 border-b text-center">Industry</th>
                <th className="px-2 py-1 border-b text-center">Status</th>
            
            </tr>
        </thead>
        <tbody>
            {filteredClients.map((client, index) => (
                <tr key={`${client.Mou_no}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-1 border-t text-center">{getPinIcon(client)}</td>
                    <td className="px-2 py-1 border-t text-center">
                        <Link to={`/css/client/${client.Mou_no}`} className="text-blue-600 hover:text-blue-800">
                            {client.Mou_no}
                        </Link>
                    </td>
                    <td className="px-2 py-1 border-t text-center">{getFlagIcon(client)}</td>
                    <td className="px-2 py-1 border-t text-center">{client.CustomerName}</td>
                    <td className="px-2 py-1 border-t text-center">
    {isEditingDate === client.Mou_no ? (
        // If editing, show the editable text input
        <input
            type="text"
            className={`w-full p-2 border rounded-lg ${isValidDateFormat(client.Date) ? 'border-gray-300' : 'border-red-500'}`}
            value={client.Date || ''}  // Set value to the current date or empty if none
            onBlur={(e) => {
                // Handle date change when user leaves the input
                handleDateChange(client.Mou_no, e.target.value);
                setIsEditingDate(null);  // Exit editing mode after blur
            }}
            onChange={(e) => {
                // Optional: you can add live validation here as the user types
                if (!isValidDateFormat(e.target.value)) {
                    e.target.classList.add('border-red-500');
                } else {
                    e.target.classList.remove('border-red-500');
                }
            }}
        />
    ) : (
        // Otherwise, show the date or error message if the format is invalid
        <span
            className={`cursor-pointer hover:underline ${isValidDateFormat(client.Date) ? 'text-blue-600' : 'text-red-600'}`}
            onClick={() => handleClickDate(client.Mou_no)}  // Start editing on click
        >
            {client.Date || "select date"}
        </span>
    )}
</td>


      
                            
                                    <td className="px-2 py-1 border-t text-center">{client.Email}</td>
                    <td className="px-2 py-1 border-t text-center">{client.Phone} / {client.Mobile}</td>
                    <td className="px-2 py-1 border-t text-center">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={comments[client.Mou_no] || ""}
                                onChange={(e) => handleCommentChange(client.Mou_no, e.target.value)}
                                placeholder="Add a comment"
                                className="border rounded p-1 text-sm flex-grow"
                            />
                            <button
                                onClick={() => handleAddComment(client.Mou_no)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                            >
                                Add
                            </button>
                        </div>

                        {client.LatestComments && client.LatestComments.length > 0 && (
                            <div className="text-sm text-gray-600 mt-2">
                                {(() => {
                                    const latestComment = client.LatestComments[client.LatestComments.length - 1];
                                    return (
                                        <div>
                                            <small className="text-gray-500">
                                                <em>by {latestComment.name} on {formatDateTime(latestComment.timestamp)}</em>
                                            </small>
                                            <p>{latestComment.comment}</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </td>
                    <td className="px-2 py-1 border-t text-center">
                        <button
                            onClick={() => openModal('language', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Language || "Add Language"}
                        </button>
                    </td>

                    <td className="px-2 py-1 border-t text-center">
                        <button
                            onClick={() => openModal('nationality', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Nationality || "Add Nationality"}
                        </button>
                    </td>
                    <td className="px-2 py-1 border-t text-center">
                        <button
                            onClick={() => openModal('industry', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Industry || "Add Industry"}
                        </button>
                    </td>
                    <td className="px-2 py-1 border-t text-center">
                        <button
                            onClick={() => openModal('status', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Status || "Add Status"}
                        </button>
                    </td>
                    <td className="px-2 py-1 border-t text-center">{client.CGID}</td>
                    <td className="px-2 py-1 border-t text-center">{client.Password}</td>
                </tr>
            ))}
        </tbody>
    </table>

    <ClientModal
        isOpen={isModalOpen}
        modalData={modalData}
        modalType={modalType}
        closeModal={closeModal}
        handleModalSave={handleModalSave}
    />
</div>





        </div>
    );
};

export default MyClients;
