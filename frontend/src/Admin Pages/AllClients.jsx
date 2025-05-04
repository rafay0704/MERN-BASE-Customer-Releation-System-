import React, { useEffect, useState, useCallback, useMemo , useRef } from 'react';
import { get, put, post } from '../services/ApiEndpoint';
import { FaSpinner } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';
import Select from 'react-select';
import { MdFlag, MdPushPin } from "react-icons/md";
import ClientModal from '../Modals/ClientModal';
import CommentsModal from '../Modals/CommentsModal';
import { FaSearch, FaTimes } from 'react-icons/fa';  // Import React Icons
import ClipLoader from 'react-spinners/ClipLoader';

const AllClients = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);

    const [filterOptions, setFilterOptions] = useState({ cssUsers: [], statuses: [], stages: [] , branches : [] , languages : [] , flags:[]});
    const [selectedFilters, setSelectedFilters] = useState({
        css: [],
        status: [],
        stage: [],
        branch: [],
        language : [] ,
        flag:[]
    });
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({}); // Data for the currently edited client
    const [modalType, setModalType] = useState(''); // 'status' or 'stage'
    const [searchKeyword, setSearchKeyword] = useState(""); // State for search keyword
    const [apiType, setApiType] = useState("Active"); // Default to "active"
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);  // New state for CommentsModal
    const [showInput, setShowInput] = useState(false);
    const [selectedCSS, setSelectedCSS] = useState(null);
    const [selectedClients, setSelectedClients] = useState([]);
    const [showShiftSection, setShowShiftSection] = useState(false);  // State to control visibility of the shift section
    const [designationCSS, setDesignationCSS] = useState([]);
    const [selectAll, setSelectAll] = useState(false); // Track if all are selected or not
    const [isEditingDate, setIsEditingDate] = useState(null); // Track if a date is being edited
   
   
   
    const [startDate, setStartDate] = useState(''); // Start date input
    const [endDate, setEndDate] = useState('');     // End date input
    const tableRef = useRef(null);
 // Function to handle changes in start and end date inputs
 const handleDateFilterChange = () => {
    if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
        toast.error('Invalid date format. Please use "DD MMM YYYY".');
        return;
    }

    const startISO = convertToISODate(startDate);
    const endISO = convertToISODate(endDate);

    const filtered = clients.filter(client => {
        const clientDateISO = convertToISODate(client.Date || '');
        return clientDateISO >= startISO && clientDateISO <= endISO;
    });

    setFilteredClients(filtered);
    updateFilterOptions(filtered); // Update other filters after date filter is applied
};

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint =
                apiType === "Active"
                    ? `/api/admin/clients/active`
                    : `/api/admin/clients/non-active`;
            const response = await get(endpoint);
            const data = response.data.clients;
            setClients(data);
            setFilteredClients(data);
            updateFilterOptions(data);
        } catch (error) {
            toast.error("Failed to fetch clients");
        } finally {
            setLoading(false);
        }
    }, [apiType]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);


    // Function to open the Comments Modal
    const openCommentsModal = (client) => {
        setModalData(client);
        setIsCommentsModalOpen(true);
    };

    const closeCommentsModal = () => {
        setIsCommentsModalOpen(false);
        setModalData({});
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
        const updatedField = modalType === 'status' ? 'Status' : 'Stage';
        const updatedClient = { ...modalData, [updatedField]: newValue.value };

        // Optimistic update
        setClients(clients.map(client =>
            client.Mou_no === updatedClient.Mou_no ? updatedClient : client
        ));
        // setFilteredClients(filteredClients.map(client =>
        //     client.Mou_no === updatedClient.Mou_no ? updatedClient : client
        // ));

        // Close modal
        closeModal();

        // Update backend
        try {
            await put(`/api/admin/client/${updatedClient.Mou_no}`, { [updatedField]: newValue.value });
        } catch (error) {
            console.error(`Error updating ${updatedField}:`, error);
        }
    };
   // Function to check if the date is in "DD MMM YYYY" format
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
        const response = await put(`/api/admin/client/${clientId}`, { Date: formattedDate });

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

    

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validFileTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        if (!validFileTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an Excel or CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        try {
            // Make POST request with progress tracking
            await post('/api/admin/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Once upload is complete, show success toast
            toast.success('File uploaded successfully!');

            // Fetch the clients again after successful upload
            const response = await get('/api/admin/clients');
            setClients(response.data.clients);
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Error uploading file.');
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    const handleClientSelect = (mouNo) => {
        setSelectedClients(prev =>
            prev.includes(mouNo) ? prev.filter(id => id !== mouNo) : [...prev, mouNo]
        );
    };

    const handleShiftCSS = async () => {

        console.log('Selected Clients:', selectedClients);  // Check selected MOU
        console.log('Selected CSS:', selectedCSS);  // Check selected CSS
        // Check if both Mou numbers and CSS are selected
        if (selectedClients.length === 0) {
            toast.error('Please select at least one Mou number.');
            return; // Exit early if no Mou numbers are selected
        }

        if (!selectedCSS) {
            toast.error('Please select a CSS.');
            return; // Exit early if no CSS is selected
        }

        // If both are selected, proceed with the shift operation
        setLoading(true);
        try {
            const response = await post('/api/admin/shift-css', {
                mouNos: selectedClients,
                cssUser: selectedCSS.value,
            });

            if (response.data.success) {
                toast.success('Clients successfully shifted to the new CSS!');
                fetchClients();  // Refresh client list
                setSelectAll(false);  // Update selectAll state to reflect deselection

            } else {
                toast.error('Failed to shift clients');
            }
        } catch (error) {
            console.error('Error shifting CSS:', error);
            toast.error('Error shifting clients');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseShiftSection = () => {
        setShowShiftSection(false);
        setSelectedClients([]); // Clear selected clients when section is closed
        setSelectedCSS(null); // Clear selected CSS user when closed
    };


   // Function to update filter options dynamically
   const updateFilterOptions = (data) => {
    const cssUsers = [...new Set(clients.map(client => client.CSS))]
        .sort()
        .map(value => ({ value, label: value })); // Use the full clients list for CSS
    const statuses = [...new Set(clients.map(client => client.Status))]
        .sort()
        .map(value => ({ value, label: value }));
    const stages = [...new Set(clients.map(client => client.Stage))]
        .sort()
        .map(value => ({ value, label: value }));
    const branches = [...new Set(clients.map(client => client.BranchLocation))]
        .sort()
        .map(value => ({ value, label: value }));
        const languages = [...new Set(clients.map(client => client.Language))]
        .sort()
        .map(value => ({ value, label: value }));
        const flags = [...new Set(clients.map(client => client.Flag))]
        .sort()
        .map(value => ({ value, label: value }));
    
    
    setFilterOptions({ cssUsers, statuses, stages, branches , languages , flags});
};

// const updateFilterOptions = (data) => {
//     const cssUsers = [...new Set(data.map(client => client.CSS))]
//         .sort()
//         .map(value => ({ value, label: value })); // Use the full clients list for CSS
//     const statuses = [...new Set(data.map(client => client.Status))]
//         .sort()
//         .map(value => ({ value, label: value }));
//     const stages = [...new Set(data.map(client => client.Stage))]
//         .sort()
//         .map(value => ({ value, label: value }));
//     const branches = [...new Set(data.map(client => client.BranchLocation))]
//         .sort()
//         .map(value => ({ value, label: value }));
//         const languages = [...new Set(data.map(client => client.Language))]
//         .sort()
//         .map(value => ({ value, label: value }));
//         const flags = [...new Set(data.map(client => client.Flag))]
//         .sort()
//         .map(value => ({ value, label: value }));
    
    
//     setFilterOptions({ cssUsers, statuses, stages, branches , languages , flags});
// };

    // Handle filter changes
    const handleFilterChange = (filterKey, selectedOptions) => {
        setSelectedFilters(prevFilters => ({
            ...prevFilters,
            [filterKey]: selectedOptions.map(option => option.value),
        }));
    };

    // Debounced filtering logic
    const applyFilters = useMemo(
        () =>
            debounce(() => {
                const { css, status, stage, branch, language , flag } = selectedFilters;
                
                // Start by filtering by date first
                let filtered = clients.filter(client => {
                    const isInDateRange = startDate && endDate ? 
                        convertToISODate(client.Date) >= convertToISODate(startDate) && 
                        convertToISODate(client.Date) <= convertToISODate(endDate) : true;
    
                    return isInDateRange;
                });
    
                // Now apply additional filters
                filtered = filtered.filter(client => {
                    const cssMatch = css.length === 0 || css.includes(client.CSS);
                    const statusMatch = status.length === 0 || status.includes(client.Status);
                    const stageMatch = stage.length === 0 || stage.includes(client.Stage);
                    const branchMatch = branch.length === 0 || branch.includes(client.BranchLocation);
                    const languageMatch = language.length === 0 || language.includes(client.Language);
                    const flagMatch = flag.length === 0 || flag.includes(client.Flag);
                    return cssMatch && statusMatch && branchMatch && stageMatch && languageMatch && flagMatch;
                });
    
                // Apply sorting after filtering
                if (sortConfig.key) {
                    filtered = filtered.sort((a, b) => {
                        const key = sortConfig.key;
                        const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
                        if (key === 'PinnedStatus' || key === 'Flag') {
                            return direction * a[key].localeCompare(b[key]);
                        } else if (key === 'Date') {
                            return direction * (new Date(a[key]) - new Date(b[key]));
                        } else {
                            return direction * a[key].toString().localeCompare(b[key].toString());
                        }
                    });
                }
    
                setFilteredClients(filtered);
                updateFilterOptions(filtered);
            }, 300),
        [clients, selectedFilters, startDate, endDate, sortConfig] // Added startDate, endDate as dependencies
    );


    useEffect(() => {
        applyFilters();
    }, [selectedFilters, applyFilters]);

    const handleTabClick = (type) => {
        if (type !== apiType) {  // Avoid re-fetching if the same tab is clicked
            setLoading(true);   // Start loading spinner
            setApiType(type);   // Change API type and trigger fetch
        }
    };

    const getPinnedIcon = (pinnedStatus) => {
        if (pinnedStatus === 'pinned') {
            return <MdPushPin className="text-blue-500" title="Pinned" />;
        }
        return <MdPushPin className="text-gray-400" title="Unpinned" />;
    };
    // Helper function to render icons based on flag color
    const getFlagIcon = (flagColor) => {
        switch (flagColor) {
            case 'yellow':
                return <MdFlag className="text-yellow-600" title="High Priority " />;
            case 'green':
                return <MdFlag className="text-green-600" title="Completed" />;
            case 'red':
                return <MdFlag className="text-red-600" title="Info" />;
            default:
                return <span>{flagColor}</span>; // or any default icon
        }
    };
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    
        const sortedClients = [...filteredClients].sort((a, b) => {
            if (key === 'PinnedStatus') {
                return direction === 'asc'
                    ? a.PinnedStatus.localeCompare(b.PinnedStatus)
                    : b.PinnedStatus.localeCompare(a.PinnedStatus);
            } else if (key === 'Flag') {
                const flagOrder = ['red', 'yellow', 'green'];
                const aIndex = flagOrder.indexOf(a.Flag);
                const bIndex = flagOrder.indexOf(b.Flag);
                return direction === 'asc' ? aIndex - bIndex : bIndex - aIndex;
            } else if (key === 'Date') {
                // Parse and validate dates
                const parseDate = (dateString) => {
                    const match = dateString.match(/(\d{2}) (\w{3}) (\d{4})/);
                    if (match) {
                        const parsedDate = new Date(`${match[2]} ${match[1]} ${match[3]}`);
                        return isNaN(parsedDate.getTime()) ? null : parsedDate;
                    }
                    return null; // Invalid date format
                };
    
                const dateA = parseDate(a[key]);
                const dateB = parseDate(b[key]);
    
                // Handle invalid dates by treating them as "less than" valid dates
                if (!dateA && !dateB) return 0; // Both are invalid, considered equal
                if (!dateA) return direction === 'asc' ? 1 : -1; // Invalid dates come last
                if (!dateB) return direction === 'asc' ? -1 : 1; // Invalid dates come last
    
                // Sort valid dates
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            } else {
                const aKey = a[key].toString().toLowerCase();
                const bKey = b[key].toString().toLowerCase();
                return direction === 'asc'
                    ? aKey.localeCompare(bKey)
                    : bKey.localeCompare(aKey);
            }
        });
    
        setFilteredClients(sortedClients);
    };
    

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchKeyword(value);
    };


    const clearSearch = () => {
        setSearchKeyword("");
    };

    const filteredBySearch = useMemo(() => {
        if (!searchKeyword) return filteredClients;

        const lowercasedSearchKeyword = searchKeyword.toLowerCase(); // Convert search keyword to lowercase

        return filteredClients.filter(client =>
            ["CustomerName", "Phone", "Email", "Mobile", "Mou_no"].some(key =>
                client[key]?.toLowerCase().includes(lowercasedSearchKeyword) // Convert client field to lowercase for comparison
            )
        );
    }, [filteredClients, searchKeyword]);




    const getHighlightedText = (text, keyword) => {
        if (!keyword) return text;

        const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === keyword.toLowerCase() ? (
                <span key={index} className="bg-green-300">{part}</span>
            ) : part
        );
    };




    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    useEffect(() => {
        const fetchCssUsers = async () => {
            try {
                const response = await get('/api/admin/getuser');
                const cssUsers = response.data.users
                    .filter(user => user.designation === 'CSS' && user.status ==="active")
                    .map(user => ({ value: user.name, label: user.name }))
                    .sort((a, b) => a.label.localeCompare(b.label));
                setDesignationCSS(cssUsers);
            } catch (error) {
                console.error("Error fetching CSS users:", error);
            }
        };
        fetchCssUsers();
    }, []);


    // Handle "Select All" functionality
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedClients([]); // Deselect all if currently all are selected
        } else {
            setSelectedClients(filteredClients.map(client => client.Mou_no)); // Select all
        }
        setSelectAll(!selectAll); // Toggle the selectAll state
    };

    const handlePrint = () => {
        const printContent = tableRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // To restore the original page state
    };
    return (
        <div className="p-8 bg-gray-50 min-h-screen">





            <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-600">All Clients</h1>

           



            {!showInput ? (
                <button
                    className="px-4 py-2 bg-blue-600 text-white mr-5 rounded-lg shadow hover:bg-blue-700"
                    onClick={() => setShowInput(true)}
                >
                    Add File
                </button>
            ) : (
                <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                    onClick={() => setShowInput(false)}
                >
                    Close
                </button>
            )}

            {/* File Input */}
            {showInput && (
                <label className="block">
                    <span className="text-gray-700">Upload Client Excel File</span>            <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                        style={{ display: 'block', width: '50' }}
                    />
                </label>
            )}
            {!showShiftSection && (
                <button
                    onClick={() => setShowShiftSection(true)}
                    className="px-4 py-2 bg-green-600 text-white mr-5 rounded-lg shadow hover:bg-green-700"
                >
                    Shift CSS
                </button>
            )}

            {showShiftSection && (
                <div>
                    {/* CSS Select Dropdown */}
                    <div className="mb-6 w-1/3">  {/* Adjust width to your preference */}
                        <label className="block text-sm font-medium text-gray-700">Select New CSS</label>
                        <Select
                            options={designationCSS}
                            onChange={setSelectedCSS}
                            value={selectedCSS}
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>


                    {/* Clients Table with Select Column */}

                    {/* Shift CSS Button */}
                    <div className="mt-4">
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                            onClick={handleShiftCSS}
                            disabled={!selectedCSS || selectedClients.length === 0}
                        >
                            {loading ? <ClipLoader color="#4b9cd3" loading={loading} size={50} />
                                : 'Shift CSS'}
                        </button>
                    </div>

                    {/* Close Button */}
                    <div className="mt-2">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                            onClick={handleCloseShiftSection}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}





            <div className="flex justify-center space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded ${apiType === "Active" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => handleTabClick("Active")}
                    disabled={loading}  // Disable button during loading
                >
                    {apiType === "Active" ? "Active" : "Active"}  {/* Removed ClipLoader */}
                </button>
                <button
                    className={`px-4 py-2 rounded ${apiType === "Non-active" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => handleTabClick("Non-active")}
                    disabled={loading}  // Disable button during loading
                >
                    {apiType === "Non-active" ? "Non-Active" : "Non-Active"}  {/* Removed ClipLoader */}
                </button>
            </div>

            <div className="date-filter">
                <div className="date-filter-input">
                    <label>Start Date:</label>
                    <input
                        type="text"
                        placeholder="DD MMM YYYY"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="date-filter-input">
                    <label>End Date:</label>
                    <input
                        type="text"
                        placeholder="DD MMM YYYY"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button className="apply-date-filter-btn" onClick={handleDateFilterChange}>
                    Apply Date Filter
                </button>
            </div>
            {/* Filters Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">CSS</label>
                    <Select
                        options={filterOptions.cssUsers}
                        isMulti
                        onChange={(selected) => handleFilterChange('css', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <Select
                        options={filterOptions.statuses}
                        isMulti
                        onChange={(selected) => handleFilterChange('status', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stage</label>
                    <Select
                        options={filterOptions.stages}
                        isMulti
                        onChange={(selected) => handleFilterChange('stage', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Branch Location</label>
                    <Select
                        options={filterOptions.branches}
                        isMulti
                        onChange={(selected) => handleFilterChange('branch', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <Select
                        options={filterOptions.languages}
                        isMulti
                        onChange={(selected) => handleFilterChange('language', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Flag</label>
                    <Select
                        options={filterOptions.flags} 
                        isMulti
                        onChange={(selected) => handleFilterChange('flag', selected)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div> */}
                 <div>
            <label className="block text-sm font-medium text-gray-700">Flag</label>
            <Select
                options={filterOptions.flags}
                isMulti
                onChange={(selected) => handleFilterChange('flag', selected)}
                className="react-select-container"
                classNamePrefix="react-select"
                getOptionLabel={(e) => (
                    <div className="flex items-center space-x-2">
                        {/* Render the flag icon */}
                        {getFlagIcon(e.value)} 
                        <span>{e.label}</span> {/* Display the label text */}
                    </div>
                )}
            />
        </div>
            </div>
            <div className="relative mb-6 max-w-sm">
                <input
                    type="text"
                    placeholder="Search by MOU , Name, Phone/Mobile, Email"
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"  // Add padding-left to create space for the search icon
                />

                {/* Display search icon when input is empty */}
                {!searchKeyword && (
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                )}

                {/* Display the clear (×) icon when there's a search keyword */}
                {searchKeyword && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500 transition duration-200"
                        title="Clear search"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>




            <button
                onClick={handlePrint}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
                Print Table
            </button>


            <div className="mb-4 text-lg p-4 bg-blue-100 text-blue-800 rounded-lg shadow-md">
                {/* Showing <span className="font-semibold text-blue-600">{apiType}</span> {filteredClients.length} of {clients.length} clients */}
                Showing <span className="font-semibold text-blue-600">{apiType}</span> {filteredClients?.length || 0} of {clients?.length || 0} clients


                {selectedClients.length > 0 && (
                    <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg shadow-md">
                        Selected Client <span className="font-semibold text-green-600">{selectedClients.length}</span>
                    </div>
                )}
            </div>
           
            {loading ? (
                <div className="flex justify-center items-center my-8">
                    <ClipLoader color="#4b9cd3" loading={loading} size={50} />

                </div>
            ) : (
                // Your client table or data rendering goes here
<div className="overflow-x-auto max-w-full"  ref={tableRef}>
    <table className="min-w-full bg-white rounded-lg shadow-md text-xs">
        <thead className="bg-gray-200">
            <tr>
                <th className="border px-4 py-3">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                    />
                </th>
                <th className="border px-4 py-3 font-semibold">Mou_no</th>
                <th className="border px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort('Flag')}>
                    Flag {getSortIcon('Flag')}
                </th>
                <th className="border px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort('CustomerName')}>
                    Customer Name {getSortIcon('CustomerName')}
                </th>
                <th className="border px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort('Date')}>
                    Date {getSortIcon('Date')}
                </th>
                <th className="border px-4 py-3 font-semibold">Phone & Mobile</th>
                <th className="border px-4 py-3 font-semibold">Email</th>
                <th className="border px-4 py-3 font-semibold">Branch</th>
                <th className="border px-4 py-3 font-semibold">CSS</th>
                <th className="border px-4 py-3 font-semibold">Comments</th>
                <th className="border px-4 py-3 font-semibold">Status</th>
                <th className="border px-4 py-3 font-semibold">Stage</th>
                <th className="border px-4 py-3 font-semibold">Language</th>
                <th className="border px-4 py-3 font-semibold">Industry</th>
                <th className="border px-4 py-3 font-semibold">Investment Fund</th>
            </tr>
        </thead>
        <tbody>
            {filteredBySearch.map((client) => (
                <tr key={client.Mou_no} className="hover:bg-gray-100 transition duration-200">
                    <td className="border px-4 py-3">
                        <input
                            type="checkbox"
                            checked={selectedClients.includes(client.Mou_no)}
                            onChange={() => handleClientSelect(client.Mou_no)}
                        />
                    </td>
                    <td className="border px-4 py-3">
                        <a
                            href={`/admin/client/${client.Mou_no}`}
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {getHighlightedText(client.Mou_no, searchKeyword)}
                        </a>
                    </td>
                    <td className="border px-4 py-3">{getFlagIcon(client.Flag)}</td>
                    <td className="border px-4 py-3">{getHighlightedText(client.CustomerName, searchKeyword)}</td>
                    <td className="px-2 py-1 border-t text-center">
    {isEditingDate === client.Mou_no ? (
        // If editing, show a normal text input
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="DD MMM YYYY" // Provide a hint for the format
            defaultValue={client.Date || ''} // Prepopulate with existing date if available
            onBlur={(e) => {
                const enteredDate = e.target.value.trim();
                if (isValidDateFormat(enteredDate)) {
                    handleDateChange(client.Mou_no, enteredDate); // Update date if valid
                } else {
                    console.error("Invalid date format. Expected 'DD MMM YYYY'");
                }
                setIsEditingDate(null); // Exit editing mode
            }}
        />
    ) : (
        // Otherwise, show the date or error message if the format is invalid
        <span
            className={`cursor-pointer hover:underline ${isValidDateFormat(client.Date) ? 'text-blue-600' : 'text-red-600'}`}
            onClick={() => handleClickDate(client.Mou_no)}
        >
            {client.Date || 'Select Date'}
        </span>
    )}
</td>                
             <td className="border px-4 py-3">{getHighlightedText(client.Phone, searchKeyword)} / {getHighlightedText(client.Mobile, searchKeyword)}</td>
                    <td className="border px-4 py-3">{getHighlightedText(client.Email, searchKeyword)}</td>
                    <td className="border px-4 py-3">{client.BranchLocation}</td>
                    <td className="border px-4 py-3">{client.CSS}</td>
                    <td className="border px-4 py-3">
                        <button
                            onClick={() => openCommentsModal(client)}
                            className="text-blue-600 underline"
                        >
                            Comments({client.LatestComments.length})
                        </button>
                    </td>
                    <td className="px-4 py-2">
                        <button
                            onClick={() => openModal('status', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Status || "No Status"}
                        </button>
                    </td>
                    <td className="px-4 py-2">
                        <button
                            onClick={() => openModal('stage', client)}
                            className="text-blue-600 underline"
                        >
                            {client.Stage}
                        </button>
                    </td>
                    <td className="px-2 py-1 border-t text-center">{client.Language}</td>
                    <td className="px-2 py-1 border-t text-center">{client.Industry || "NF"}</td>
                    <td className="border px-4 py-3">£ {client.InvestmentFund}</td>
                </tr>
            ))}
        </tbody>
    </table>

    <CommentsModal
        isOpen={isCommentsModalOpen}
        client={modalData}
        closeModal={closeCommentsModal}
    />
    <ClientModal
        isOpen={isModalOpen}
        modalData={modalData}
        modalType={modalType}
        closeModal={closeModal}
        handleModalSave={handleModalSave}
    />
</div>

            )}





            <ToastContainer />
        </div>
    );
};

export default AllClients;
