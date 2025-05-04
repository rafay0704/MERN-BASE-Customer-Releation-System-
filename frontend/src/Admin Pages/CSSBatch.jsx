import React, { useState, useEffect } from 'react';
import { get, post } from '../services/ApiEndpoint';
import moment from 'moment';
import { FiXCircle } from 'react-icons/fi';  // Importing clear icon
import DailyBatchViewer from './DailyBatchViewer';

const CSSBatch = () => {
    const [cssStats, setCssStats] = useState([]);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
    const [cssUser, setCssUser] = useState('');
    const [mouData, setMouData] = useState([]);
    const [error, setError] = useState(null);
    const [mouError, setMouError] = useState(null);
    const [isDataFetched, setIsDataFetched] = useState(false);

    // Fetch CSS user stats when component mounts
    useEffect(() => {
        const fetchCssStats = async () => {
            try {
                const response = await get('/api/admin/css-user-stats');
                if (response.data.success) {
                    setCssStats(response.data.cssStats);
                } else {
                    setError('Failed to fetch CSS user stats.');
                }
            } catch (error) {
                setError('Error fetching CSS details.');
            }
        };
        fetchCssStats();
    }, []);

    // Function to fetch MOU data based on the selected CSS user and date range
    const fetchMouData = async () => {
        if (!cssUser || !startDate || !endDate) {
            setMouError('Please fill in all fields.');
            return;
        }

        try {
            const response = await post('/api/admin/css-mou-by-date', {
                cssUser,
                startDate,
                endDate,
            });


            console.log(mouData); // Check the structure of the fetched MOU data
            console.log(response.data); // Debugging to see the data structure

            if (response.data.success) {
                const flatMouData = response.data.mouData.flat(); // Flatten nested arrays
                setMouData(flatMouData);
                setIsDataFetched(true);
                setMouError(null);
            } else {
                setMouError('No data found for the selected CSS user and date range.');
            }
        } catch (error) {
            setMouError('Error fetching MOU data.');
        }
    };

    // Function to clear filters
    const clearFilters = () => {
        setCssUser('');
        setStartDate(moment().startOf('month').format('YYYY-MM-DD'));
        setEndDate(moment().endOf('month').format('YYYY-MM-DD'));
        setIsDataFetched(false);
        setMouData([]);
    };

    // Function to download CSS User Stats table as CSV
    const downloadCssUserStats = () => {
        const csvContent = [
            ['CSS User', 'Total Clients', 'Current Batch Clients', 'Last Batch Date', 'Next Batch Clients', 'Batches Left'],
            ...cssStats.map(css => [
                css.cssUser,
                css.totalClients,
                css.lastBatchClientsCount,
                css.lastBatchGeneratedDate ? moment(css.lastBatchGeneratedDate).format('DD-MM-YYYY hh:mm A') : 'N/A',
                css.nextBatchClientsCount,
                css.remainingBatches,
                css.cycleCount,
                css.totalBatches
            ]),
        ]
        .map(e => e.join(","))
        .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'css_user_stats.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to download MOU data as CSV
    const downloadMouData = () => {
        const csvContent = [
            ['MOU No', 'Customer Name', 'Batch Date', 'Visa Category', 'Phone', 'Mobile', 'Branch', 'Status', 'Latest Comments'],
            ...mouData.map(mou => [
                mou.mou,
                mou.customerName,
                moment(mou.batchDate).format('DD-MM-YYYY'),
                mou.visaCategory,
                mou.phone,
                mou.mobile,
                mou.branch,
                mou.status,
                mou.latestComments && mou.latestComments.length > 0
                    ? mou.latestComments.map(comment => `${comment.name}: ${comment.comment}`).join('; ')
                    : 'No comments available',
            ]),
        ]
        .map(e => e.join(","))
        .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mou_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg mx-auto">
            {/* CSS Batch Monitoring Section */}
            <h2 className="text-4xl font-bold mb-6 text-center text-blue-700">Daily Clients Batches </h2>
            <div className="mb-6 flex justify-center space-x-4">
                <button
                    onClick={downloadCssUserStats}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                    Download CSS  Stats
                </button>
                <button
                    onClick={downloadMouData}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                    Download MOU Data
                </button>
            </div>
            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

            {/* CSS User Stats Table */}
            <table className="table-auto w-full border border-gray-300 mb-6 bg-white rounded-lg shadow-md">
    <thead>
        <tr className="bg-blue-100 text-sm">
            <th className="px-4 py-2 border border-gray-300 text-center">CSS </th>
            <th className="px-4 py-2 border border-gray-300 text-center">Total Clients</th>
            <th className="px-4 py-2 border border-gray-300 text-center">Cycle</th>
            <th className="px-4 py-2 border border-gray-300 text-center">Current Batch Clients</th>
            <th className="px-4 py-2 border border-gray-300 text-center">Next Batch Clients</th>
            <th className="px-4 py-2 border border-gray-300 text-center">Current Batch Date</th>
            <th className="px-4 py-2 border border-gray-300 text-center">Total Batches</th>
            {/* <th className="px-4 py-2 border border-gray-300 text-center">Batches Left</th> */}
        </tr>
    </thead>
    <tbody>
        {cssStats.map((css, index) => (
            <tr key={index} className="hover:bg-gray-100 transition-colors duration-200 text-sm">
                <td className="px-4 py-2 border border-gray-300 text-center">{css.cssUser}</td>
                <td className="px-4 py-2 border border-gray-300 text-center">{css.totalClients}</td>
                <td className="px-4 py-2 border border-gray-300 text-center">{css.cycleCount}</td>

                <td className="px-4 py-2 border border-gray-300 text-center">{css.lastBatchClientsCount}</td>
                <td className="px-4 py-2 border border-gray-300 text-center">{css.nextBatchClientsCount}</td>

                <td className="px-4 py-2 border border-gray-300 text-center">
                    {css.lastBatchGeneratedDate
                        ? moment(css.lastBatchGeneratedDate).format('DD-MM-YYYY hh:mm A')
                        : 'N/A'}
                </td>
                <td className="px-4 py-2 border border-gray-300 text-center">{css.totalBatches}</td>
                {/* <td className="px-4 py-2 border border-gray-300 text-center">{css.remainingBatches}</td> */}
            </tr>
        ))}
    </tbody>
</table>


            {/* Download Buttons */}
           

            {/* MOU Data Fetching Section */}
            <h2 className="text-2xl font-bold mb-4 text-center text-green-600">Fetch MOU Data by Date Range</h2>

            {/* Input fields for CSS User and Date Range */}
            <div className="mb-4 flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                <select
                    value={cssUser}
                    onChange={(e) => setCssUser(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="">Select CSS User</option>
                    {cssStats.map((css, index) => (
                        <option key={index} value={css.cssUser}>
                            {css.cssUser}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                    onClick={fetchMouData}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                    Fetch MOU Data
                </button>
                <button
                    onClick={clearFilters}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                    <FiXCircle className="inline-block mr-2" />
                    Clear Filters
                </button>
            </div>

            {/* Error message for MOU data fetching */}
            {mouError && <div className="text-red-500 mb-4 text-center">{mouError}</div>}
 {/* Display fetched date range and count of MOUs */}
 {isDataFetched && mouData.length > 0 && (
                <div className="mb-6 text-center text-lg text-gray-600">
                    <p>
                        Data fetched for <span className="font-semibold">{cssUser}</span> from{' '}
                        <span className="font-semibold">{moment(startDate).format('DD-MM-YYYY')}</span> to{' '}
                        <span className="font-semibold">{moment(endDate).format('DD-MM-YYYY')}</span>
                    </p>
                    <p>Total MOUs fetched: <span className="font-semibold">{mouData.length}</span></p>
                </div>
            )}
            {/* MOU Data Table */}
            {isDataFetched && mouData.length > 0 && (
                <div className="overflow-x-auto"> {/* Prevent horizontal scroll */}
                  <table className="table-auto w-full border border-gray-300 mb-6 bg-white rounded-lg shadow-md text-sm">
            <thead>
                <tr className="bg-green-100">
                    <th className="px-4 py-2 border border-gray-300 text-center">MOU No</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Customer Name</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Batch Date</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Visa Category</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Phone</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Mobile</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Branch</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Status</th>
                    <th className="px-4 py-2 border border-gray-300 text-center">Medium</th> {/* Add Medium Column */}
                    <th className="px-14 py-2 border border-gray-300 text-center">Latest Comments</th>
                </tr>
            </thead>
            <tbody>
                {mouData.map((mou, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors duration-200">
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.mou}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.customerName}</td>
                        <td className="border border-gray-300 text-center">{moment(mou.batchDate).format('DD-MM-YYYY HH:mm A')}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.visaCategory}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.phone}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.mobile}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.branch}</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">{mou.status}</td>

                        <td className="px-4 py-2 border border-gray-300 text-center">
    {mou.medium ? mou.medium : 'Not specified'} {/* Fallback text */}
</td>
                        <td className="px-4 py-2 border border-gray-300 text-center">
                            {mou.latestComments && mou.latestComments.length > 0 ? (
                                mou.latestComments.map((comment, i) => (
                                    <div key={i} className="text-gray-700 mb-1">
                                        <strong>{comment.name}:</strong> {comment.comment} <br />
                                        <span className="text-xs text-gray-500">{moment(comment.timestamp).format('DD-MM-YYYY hh:mm A')}</span>
                                    </div>
                                ))
                            ) : (
                                <p>No comments available</p>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

                </div>
            )}

            <DailyBatchViewer/>
        </div>
    );
};

export default CSSBatch;
