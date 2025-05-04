import React from "react";



const ClientProfile = ({
    client,
    statusOptions,
    stageOptions,
    isEditing,
    formData,
    handleChange,
    handleSaveClientDetails,
    setIsEditing,
    customStatus,
    setCustomStatus,
    industryOptions,
    customIndustry,
    setCustomIndustry,
}) => {


    
    return (
        <div className="w-1/2 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
            {/* Client Information */}
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {client.CustomerName}
            </h2>
            {isEditing ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveClientDetails();
                    }}
                    className="space-y-6 mb-6"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Mou_no:
                        </label>
                        <input
                            type="text"
                            name="Mou_no"
                            value={formData.Mou_no || ""}
                            onChange={handleChange}
                            disabled
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Customer Name:
                        </label>
                        <input
                            type="text"
                            name="CustomerName"
                            value={formData.CustomerName || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email:
                        </label>
                        <input
                            type="text"
                            name="Email"
                            value={formData.Email || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                   
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone:
                        </label>
                        <input
                            type="text"
                            name="Phone"
                            value={formData.Phone || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Mobile:
                        </label>
                        <input
                            type="text"
                            name="Mobile"
                            value={formData.Mobile || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                  
                  
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Status:
                        </label>
                        <select
                            name="Status"
                            value={formData.Status || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        >
                            {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.Status === "Other" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Custom Status:
                            </label>
                            <input
                                type="text"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.target.value)}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                  
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Industry:
                        </label>
                        <select
                            name="Status"
                            value={formData.Industry || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                        >
                            {industryOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.Industry === "Other" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Custom Industry:
                            </label>
                            <input
                                type="text"
                                value={customIndustry}
                                onChange={(e) => setCustomIndustry(e.target.value)}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                </form>
            ) : (
                <div className="space-y-4 mb-6">
                    <p><strong>Mou_no:</strong> {client.Mou_no}</p>
                    <p><strong>Date:</strong> {client.Date}</p>
                    <p><strong>Customer Name:</strong> {client.CustomerName}</p>
                    <p><strong>Visa Category:</strong> {client.VisaCatagory}</p>
                    <p><strong>Mobile:</strong> {client.Mobile}</p>
                    <p><strong>Phone:</strong> {client.Phone}</p>
                    <p><strong>Email:</strong> {client.Email}</p>
                    <p><strong>Nationality:</strong> {client.Nationality}</p>
                    <p><strong>Branch Location:</strong> {client.BranchLocation}</p>
                    <p><strong>Sales Advisor:</strong> {client.SalesAdvisor}</p>
                    <p><strong>CSS:</strong> {client.CSS}</p>
                    <p><strong>Status:</strong> {client.Status}</p>
                    <p><strong>Language:</strong> {client.Language}</p>
                    <p><strong>CGID:</strong> {client.CGID}</p>
                    <p><strong>Password:</strong> {client.Password}</p>
                    <p><strong>Stage:</strong> {client.Stage}</p>
                    <p><strong>Flag:</strong> {client.Flag}</p>
                    <p><strong>Recent Comments:</strong> {client.RecentComments}</p>
                    <p><strong>Industry:</strong> {client.Industry}</p>
                    <p><strong>Investment Fund:</strong> {client.InvestmentFund}</p>
                </div>
            )}

            {/* Edit and Save Buttons */}
            <div className="flex justify-end space-x-4">
                <button
                    className={`px-4 py-2 text-white ${isEditing ? "bg-red-500" : "bg-blue-500"} rounded shadow-md hover:bg-${isEditing ? "red" : "blue"}-600 transition`}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? "Cancel" : "Edit Details"}
                </button>
                {isEditing && (
                    <button
                        onClick={handleSaveClientDetails}
                        className="px-4 py-2 text-white bg-green-500 rounded shadow-md hover:bg-green-600 transition"
                    >
                        Save
                    </button>
                )}
            </div>
        </div>
    );
};

export default ClientProfile;
