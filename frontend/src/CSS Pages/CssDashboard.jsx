import React, { useEffect, useState } from 'react';
import { get } from "../services/ApiEndpoint";
import { Link } from "react-router-dom";
import { Pie } from 'react-chartjs-2';
import { MdArrowBack, MdArrowForward, MdAlarm, MdAlarmOff } from "react-icons/md";

const CssDashboard = () => {
    const [clients, setClients] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [criticalHighlights, setCriticalHighlights] = useState([]);
    const [criticalClients, setCriticalClients] = useState([]);
    const [currentCommitmentPage, setCurrentCommitmentPage] = useState(0);
    const [currentHighlightPage, setCurrentHighlightPage] = useState(0);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await get('/api/css/my-clients');
                setClients(response.data.clients);
                extractData(response.data.clients);
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };
        fetchData();
    }, []);

    const extractData = (clients) => {
        const pendingCommitments = clients.flatMap(client =>
            client.Commitments
                .filter(commitment => commitment.status === 'not done')
                .map(commitment => ({ ...commitment, CustomerName: client.CustomerName, Mou_no: client.Mou_no }))
        );

        const sortedCommitments = pendingCommitments.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setCommitments(sortedCommitments);

        const criticalData = clients.flatMap(client =>
            client.CriticalHighlights.map(highlight => ({
                ...highlight,
                CustomerName: client.CustomerName,
                Mou_no: client.Mou_no
            }))
        ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        setCriticalHighlights(criticalData);

        const redFlagClients = clients.filter(client => client.Flag === "red");
        setCriticalClients(redFlagClients);
    };

    const calculateRemainingTime = (deadline) => {
        const today = new Date();
        const dueDate = new Date(deadline);
        const timeDiff = dueDate - today;

        if (timeDiff >= 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            return { passed: false, days, hours, minutes, seconds };
        } else {
            const elapsedTime = Math.abs(timeDiff);
            const days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((elapsedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((elapsedTime % (1000 * 60)) / (1000 * 60));
            const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
            return { passed: true, days, hours, minutes, seconds };
        }
    };

    const displayedCommitments = commitments.slice(currentCommitmentPage * itemsPerPage, (currentCommitmentPage + 1) * itemsPerPage);
    const handlePrevCommitmentPage = () => {
        if (currentCommitmentPage > 0) setCurrentCommitmentPage(currentCommitmentPage - 1);
    };

    const handleNextCommitmentPage = () => {
        if ((currentCommitmentPage + 1) * itemsPerPage < commitments.length) setCurrentCommitmentPage(currentCommitmentPage + 1);
    };

    const displayedCriticalHighlights = criticalHighlights.slice(currentHighlightPage * itemsPerPage, (currentHighlightPage + 1) * itemsPerPage);
    const handlePrevHighlightPage = () => {
        if (currentHighlightPage > 0) setCurrentHighlightPage(currentHighlightPage - 1);
    };

    const handleNextHighlightPage = () => {
        if ((currentHighlightPage + 1) * itemsPerPage < criticalHighlights.length) setCurrentHighlightPage(currentHighlightPage + 1);
    };

    const totalClients = clients.length;
    const businessPlanRequired = clients.filter(client => client.Status === "Business Plan Required").length;
    const incompleteCommitments = commitments.length;
    const redFlagClients = criticalClients.length;

    const statusDistribution = clients.reduce((acc, client) => {
        acc[client.Status] = (acc[client.Status] || 0) + 1;
        return acc;
    }, {});
    const pieData = {
        labels: Object.keys(statusDistribution),
        datasets: [{
            data: Object.values(statusDistribution),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40', '#9966FF', '#FFCD56'],
        }],
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">CSS Dashboard</h1>
            {/* <div>
      <BreakManager />
    </div> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[{ title: "Total Clients", count: totalClients },
                  { title: "Business Plan Required", count: businessPlanRequired },
                  { title: "Incomplete Commitments", count: incompleteCommitments },
                  { title: "Critical Clients", count: redFlagClients }].map((item, index) => (
                    <div key={index} className="bg-white p-5 shadow rounded-lg hover:shadow-md transition duration-300">
                        <h2 className="text-lg font-semibold text-gray-600">{item.title}</h2>
                        <p className="text-3xl font-bold text-gray-800">{item.count}</p>
                    </div>
                ))}
            </div>

            {/* Pie Chart and Commitments in one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-600 mb-4">Clients by Status</h2>
                    <div style={{ width: '85%', height: '85%', margin: 'auto' }}>
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-600 mb-4">Upcoming Commitments</h2>
                    <ul className="max-h-64 overflow-y-auto">
                        {displayedCommitments.map((commitment, index) => {
                            const { passed, days, hours, minutes, seconds } = calculateRemainingTime(commitment.deadline);
                            const isDeadlinePassed = passed;
                            return (
                                <li key={index} className="mb-3 p-3 bg-gray-50 rounded-md flex items-center">
                                    {isDeadlinePassed ? (
                                        <MdAlarmOff className="text-red-500 mr-2" />
                                    ) : (
                                        <MdAlarm className="text-green-500 mr-2" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-700">{commitment.commitment}</p>
                                        <small className="text-gray-500">
                                            <Link to={`/css/client/${commitment.Mou_no}`} className="text-blue-500 hover:text-blue-700">
                                                {commitment.CustomerName} ({commitment.Mou_no})
                                            </Link> |     
                                            {isDeadlinePassed ? (
                                                <span className="text-red-500 font-bold">
                                                    {new Date(commitment.deadline).toLocaleString()} (Passed {days} days, {hours} hours, {minutes} minutes, {seconds} seconds ago)
                                                </span>
                                            ) : (
                                                <span className="text-green-500 font-bold">
                                                    {`${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds remaining`}
                                                </span>
                                            )}
                                        </small>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="flex justify-between mt-4">
                        <button onClick={handlePrevCommitmentPage} disabled={currentCommitmentPage === 0} className="text-blue-500 disabled:text-gray-400">
                            <MdArrowBack />
                        </button>
                        <button onClick={handleNextCommitmentPage} disabled={(currentCommitmentPage + 1) * itemsPerPage >= commitments.length} className="text-blue-500 disabled:text-gray-400">
                            <MdArrowForward />
                        </button>
                        
                    </div>
                </div>
            </div>

            {/* Critical Highlights and Critical Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 shadow rounded-lg">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Critical Highlights</h2>
                    <ul className="max-h-64 overflow-y-auto">
                        {displayedCriticalHighlights.map((highlight, index) => (
                            <li key={index} className="mb-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-gray-600">{highlight.criticalHighlight} |  Expiry Date: {new Date(highlight.expiryDate).toLocaleDateString()}</p>
                               
                                <p className="text-blue-500 font-semibold">
                                    <Link to={`/css/client/${highlight.Mou_no}`}>
                                        {highlight.CustomerName} ({highlight.Mou_no})
                                    </Link>
                                </p>
                              
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between mt-4">
                        <button onClick={handlePrevHighlightPage} disabled={currentHighlightPage === 0} className="text-blue-500 disabled:text-gray-400">
                            <MdArrowBack />
                        </button>
                        <button onClick={handleNextHighlightPage} disabled={(currentHighlightPage + 1) * itemsPerPage >= criticalHighlights.length} className="text-blue-500 disabled:text-gray-400">
                            <MdArrowForward />
                        </button>
                    </div>
                </div>
                

                <div className="bg-white p-6 shadow rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-600 mb-4">Critical Clients  {redFlagClients}  </h2>
                    <ul className="max-h-64 overflow-y-auto">
                        {criticalClients.map((client, index) => (
                            <li key={index} className="mb-3 p-3 bg-red-50 rounded-md">
                              
                                <p className="text-red-500 font-semibold">
                                <Link to={`/css/client/${client.Mou_no}`} className="text-red-500 hover:text-red-700">
                                    {client.CustomerName} ({client.Mou_no})
                                </Link>
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CssDashboard;
