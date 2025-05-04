import React from "react";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

const ClientComments = ({
    client,
    profilePictures,
    userType,
    selectedTab,
    handleTabChange,
    editingCommentId,
    editingCommentText,
    handleCommentEditChange,
    handleSaveCommentEdit,
    handleEditComment,
    handleDeleteComment,
    handleToggleCommitmentStatus,
    newComment,
    setNewComment,
    isCommitment,
    setIsCommitment,
    newDeadline,
    setNewDeadline,
    handleAddCommentOrCommitment,
    handleCopyPrompt,
}) => {
    return (
        <div className="m-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Comments & Commitments 

               
            </h3>
            
            {/* Tabs for toggling */}
            <div className="flex mb-4">
                <button
                    onClick={() => handleTabChange("Comments")}
                    className={`px-4 py-2 ${selectedTab === "Comments" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                >
                    Comments
                </button>
                <button
                    onClick={() => handleTabChange("Commitments")}
                    className={`px-4 py-2 ml-2 ${selectedTab === "Commitments" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                >
                    Commitments
                </button>
            </div>

            {/* Display Comments */}
            {selectedTab === "Comments" && (
                <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-700">Comments</h4>
                    {client?.LatestComments.map((comment) => (
                        <div key={comment._id} className="bg-gray-100 p-4 rounded-md shadow-sm flex items-start space-x-3">
                            {/* <img
                                src={profilePictures[comment.name] || "/default-profile.png"}
                                alt={`${comment.name}'s profile`}
                                className="w-8 h-8 rounded-full"
                            /> */}
                            <img
                src={profilePictures[comment.name]}
                alt={comment.name}
                className="w-12 h-12 rounded-full"
              />


                            <div className="flex-grow">
                                {editingCommentId === comment._id ? (
                                    <div>
                                        <textarea
                                            value={editingCommentText}
                                            onChange={handleCommentEditChange}
                                            className="w-full p-2 border rounded mb-2"
                                        />
                                        <button
                                            onClick={handleSaveCommentEdit}
                                            className="bg-green-500 text-white p-2 rounded mr-2"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingCommentId(null)}
                                            className="bg-gray-300 p-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p>{comment.comment}</p>
                                        <small className="text-gray-500">
                                            By {comment.name} on {new Date(comment.timestamp).toLocaleString()}
                                        </small>
                                    </>
                                )}
                            </div>
                            {userType === "admin" && editingCommentId !== comment._id && (
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEditComment(comment._id, comment.comment)} className="text-blue-500">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteComment(comment._id)} className="text-red-500">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Display Commitments */}
            {selectedTab === "Commitments" && (
                <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-700">Commitments</h4>
                    {client?.Commitments.map((commitment) => (
                        <div key={commitment._id} className="bg-gray-100 p-4 rounded-md shadow-sm flex items-center space-x-3">
                            {/* <img
                                src={profilePictures[commitment.name] || "/default-profile.png"}
                                alt={`${commitment.name}'s profile`}
                                className="w-8 h-8 rounded-full"
                            /> */}

<img
                src={profilePictures[commitment.name]}
                alt={commitment.name}
                className="w-12 h-12 rounded-full"
              />
                            <div className="flex-grow">
                                <p>{commitment.commitment}</p>
                                <small className="text-gray-500">
                                    By {commitment.name} Due: {new Date(commitment.deadline).toLocaleString()} Added on:{" "}
                                    {new Date(commitment.timestamp).toLocaleString()}
                                </small>
                            </div>
                            <button
                                onClick={() => handleToggleCommitmentStatus(commitment._id, commitment.status)}
                                className={`text-xl ${commitment.status === "done" ? "text-green-500" : "text-gray-400"}`}
                            >
                                {commitment.status === "done" ? <FaCheckCircle /> : <FaCircle />}
                            </button>
                            {commitment.AdminCheck === true ? <FaCheckCircle /> : <FaCircle />}
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Comment or Commitment */}
            <div className="mt-6">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your comment or commitment here..."
                    className="w-full p-2 border rounded mb-2"
                />
                {isCommitment && (
                    <input
                    type="datetime-local" // Allows user to select both date and time
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-30 p-2 border rounded mb-2"
                />
                )}
                <div className="flex items-center space-x-2">
                    <button onClick={handleAddCommentOrCommitment} className="bg-blue-500 text-white p-2 rounded">
                        {isCommitment ? "Add Commitment" : "Add Comment"}
                    </button>
                    <label className="flex items-center space-x-1">
                        <input type="checkbox" checked={isCommitment} onChange={() => setIsCommitment(!isCommitment)} />
                        <span>Add as Commitment</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ClientComments;
