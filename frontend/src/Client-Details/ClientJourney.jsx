import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import Confetti from "react-confetti";

const ClientJourney = ({
    statusOptions,
    currentIndex,
    currentStageIndex,
    stageOptions,
    profilePictures,
    client,
}) => {
    const currentStatus = statusOptions[currentIndex];
    const currentStage = stageOptions[currentStageIndex];
    const [showConfetti, setShowConfetti] = useState(false);
    const [showFailure, setShowFailure] = useState(false);

    // Trigger confetti if status is 'Endorsed' or 'Visa Granted'
    useEffect(() => {
        if (["Endorsed", "Visa Granted"].includes(currentStatus)) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [currentStatus]);

    // Trigger failure overlay if status is 'Endorsement Failed'
    useEffect(() => {
        if (currentStatus === "Endorsement Failed") {
            setShowFailure(true);
            const timer = setTimeout(() => setShowFailure(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [currentStatus]);

    // Trigger confetti if status is 'Endorsed' or 'Visa Granted'
    useEffect(() => {
        if (["Endorsed", "Visa Granted"].includes(currentStage)) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [currentStage]);

    // Trigger failure overlay if status is 'Endorsement Failed'
    useEffect(() => {
        if (currentStage === "Endorsement Failed") {
            setShowFailure(true);
            const timer = setTimeout(() => setShowFailure(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [currentStage]);

    return (
        <div className="relative w-full p-8 bg-gray-50 rounded-lg shadow-lg">
            {/* Confetti for success */}
            {showConfetti && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                />
            )}

            {/* Failure overlay */}
            {showFailure && (
                <div className="absolute inset-0 bg-red-600 bg-opacity-80 flex items-center justify-center z-10">
                    <p className="text-white text-2xl font-bold">Endorsement Failed</p>
                </div>
            )}

<h2 className="text-2xl font-bold text-indigo-600 mt-8 mb-4 text-center">
               Client Stage
            </h2>

            {/* Zigzag Status Bar */}
            <div className="flex items-center justify-center w-full mt-4 space-x-6">
                {stageOptions.map((status, index) => {
                    const isCurrent = index === currentStageIndex;

                    return (
                        <div
                            key={index}
                            className={`relative flex flex-col items-center text-center ${isCurrent ? "text-blue-600 font-bold" : "text-gray-500"}`}
                        >
                            <div className="flex items-center justify-center mb-2">
                                {isCurrent ? (
                                    <div className="w-10 h-10 bg-blue-600 rounded-full border-4 border-indigo-300"></div>
                                ) : (
                                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                )}
                            </div>
                            <span className="text-sm font-semibold">{status}</span>
                        </div>
                    );
                })}
            </div>
 {/* ShiftCSS History */}
 <h2 className="text-2xl font-bold text-indigo-600 mt-8 mb-4 text-center">
                Shift CSS History
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Card: Old CSS */}
                {client.oldCSS && (
                    <div className="p-4 bg-blue-100 rounded-lg shadow-md">
                        <h3 className="font-medium text-gray-800">Initial CSS</h3>
                        <p className="text-sm text-gray-600">
                            CSS: {client.oldCSS.CSS}
                        </p>
                        <p className="text-xs text-gray-500">
                            Date: {new Date(client.oldCSS.Date).toLocaleDateString()}
                        </p>
                    </div>
                )}
                {/* Cards for Shifted CSS */}
                {client.ShiftCSS && client.ShiftCSS.length > 0 ? (
                    client.ShiftCSS.map((shift, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-100 rounded-lg shadow-md"
                        >
                            <p className="font-medium text-gray-800">New CSS: {shift.NewCSS}</p>
                            <p className="text-sm text-gray-600">
                                Date: {new Date(shift.Date).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No CSS shift history available.</p>
                )}
            </div>


 {/* Stage History */}
 <h2 className="text-2xl font-bold text-indigo-600 mt-8 mb-4 text-center">
               Stage History
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Card: Old CSS */}
               
                {/* Cards for Shifted CSS */}
                {client.StageHistory && client.StageHistory.length > 0 ? (
                    client.StageHistory.map((stage, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-100 rounded-lg shadow-md"
                        >
                            <p className="font-medium text-gray-800">New Stage: {stage.newStage}</p>
                            <p className="text-sm text-gray-600">
                                Date: {new Date(stage.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No Stage History available.</p>
                )}
            </div>



            <h2 className="text-2xl font-bold text-indigo-600 mt-8 mb-4 text-center">
    Client Status
</h2>

            {/* Two Rows for Status */}
            <div className="flex flex-wrap justify-center w-full mt-4 gap-12">
                {statusOptions.map((status, index) => {
                    const isCurrent = index === currentIndex;
                    const isPast = index < currentIndex;

                    return (
                        <div
                            key={index}
                            className={`relative flex flex-col items-center text-center ${
                                isPast
                                    ? "text-green-600"
                                    : isCurrent
                                    ? "text-blue-600"
                                    : "text-gray-500"
                            } hover:scale-105 transform transition-all duration-300`}
                        >
                            <div className="flex items-center justify-center mb-2">
                                {isPast ? (
                                    <FaCheckCircle className="text-green-600 w-10 h-10 animate-pulse" />
                                ) : isCurrent ? (
                                    <div className="w-10 h-10 bg-blue-600 rounded-full animate-ping"></div>
                                ) : (
                                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                )}
                            </div>
                            <span className="text-xs font-semibold">{status}</span>
                        </div>
                    );
                })}
            </div>

           
        </div>
    );
};

export default ClientJourney;
