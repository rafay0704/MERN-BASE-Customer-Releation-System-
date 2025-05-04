import { get } from "../services/ApiEndpoint.jsx";
import { useState, useEffect, Fragment } from "react";
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";

const DailyBatchViewer = () => {
    const [batches, setBatches] = useState([]);
    const [expandedBatch, setExpandedBatch] = useState(null);

    useEffect(() => {
        fetchLastBatches();
    }, []);

    const fetchLastBatches = async () => {
        try {
            const response = await get("/api/admin/last-batches");
            setBatches(response.data.data);
        } catch (error) {
            console.error("Error fetching batches:", error);
        }
    };

    const compareDates = (batchDate) => {
        const today = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" });
        const batchDateString = new Date(batchDate).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" });
        return today === batchDateString;
    };

    const handleExpandClick = (cssUser) => {
        setExpandedBatch(expandedBatch === cssUser ? null : cssUser);
    };


    const handleDownload = (batch) => {
        const batchDate = new Date(batch.batchDate).toLocaleDateString("en-GB");
        const fileName = `${batch.cssUser}_${batchDate}.txt`;
        let fileContent = `CSS User: ${batch.cssUser}\nBatch Date: ${batchDate}\n\n`;

        batch.mous.forEach((mou) => {
            fileContent += `${mou.customerName} - ${mou.mou}\n`;
        });

        const blob = new Blob([fileContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    };

    return (
        <div className="p-6 rounded-lg shadow-lg max-w-screen-lg mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-yellow-700">Today Daily 20 Clients</h2>

            <div className="text-center mb-4">
                <button
                    onClick={fetchLastBatches}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                >
                    Refresh Batches
                </button>
            </div>

            <div className="space-y-6">
                {batches.map((batch) => {
                    let totalGreenCount = 0;
                    let totalRedCount = 0;

                    batch.comments?.forEach((comment) => {
                        comment.comments.forEach((c) => {
                            const isSameDate = compareDates(c.timestamp);
                            if (isSameDate) totalGreenCount++;
                            else totalRedCount++;
                        });
                    });

                    return (
                        <div key={batch.cssUser} className="border bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg text-gray-800">{batch.cssUser}</h3>

                                <div className="flex items-center space-x-2">
                                    {compareDates(batch.batchDate) ? (
                                        <AiFillCheckCircle className="text-green-500" title="Batch completed today" />
                                        
                                    ) : (
                                        <Fragment>
                                            <AiFillCloseCircle className="text-red-500" title="Batch not completed today" />
                                            <span className="text-gray-600">Not Yet</span>
                                        </Fragment>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleExpandClick(batch.cssUser)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                                >
                                    {expandedBatch === batch.cssUser ? "Collapse" : "Expand"} Clients 
                                </button>
                            </div>

                            <p className="text-gray-600">Batch Date: {new Date(batch.batchDate).toLocaleString()}</p>
                            <p className={`text-${totalGreenCount > 0 ? "green" : "gray"}-600`}>
                                Done Clients: {totalGreenCount}
                            </p>
                            <p className={`text-${totalRedCount > 0 ? "red" : "gray"}-600 mb-4`}>
                                Remaining Clients: {totalRedCount}
                            </p>

                            {/* Download Notepad Button */}
                            {/* <button
                                onClick={() => handleDownload(batch)}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 mb-4"
                            >
                                Download Notepad File
                            </button> */}

                            {expandedBatch === batch.cssUser && (
                                <Fragment>
                                    <div className="overflow-x-auto mt-4 transition-all ease-in-out duration-500">
                                        <table className="min-w-full table-auto border-collapse bg-gray-50 shadow-inner">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th className="px-4 py-2 border text-left">Customer Name</th>
                                                    <th className="px-4 py-2 border text-left">MOU</th>
                                                    <th className="px-4 py-2 border text-left">Medium</th>
                                                    <th className="px-4 py-2 border text-left">Comments</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {batch.mous.map((mou, index) => (
                                                    <tr key={index} className="hover:bg-gray-100">
                                                        <td className="px-2 py-2 border">{mou.customerName}</td>
                                                        <td className="px-2 py-2 border">{mou.mou}</td>
                                                        <td className="px-2 py-2 border">{mou.medium}</td>
                                                        <td className="px-2 py-2 border">
                                                            {batch.comments
                                                                ?.filter((comment) => comment.mou === mou.mou)
                                                                .map((comment, idx) => (
                                                                    <div key={idx}>
                                                                        {comment.comments.map((c, i) => {
                                                                            const isSameDate = compareDates(c.timestamp);
                                                                            return (
                                                                                <div
                                                                                    key={i}
                                                                                    className={`text-sm ${
                                                                                        isSameDate ? "bg-green-100" : "bg-red-100"
                                                                                    } p-2 rounded-md`}
                                                                                >
                                                                                    <strong>Comment by {c.name}:</strong>
                                                                                    <p>
                                                                                        <strong>Timestamp:</strong>{" "}
                                                                                        {new Date(c.timestamp).toLocaleString()}
                                                                                    </p>
                                                                                    <p>{c.comment}</p>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Fragment>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyBatchViewer;
