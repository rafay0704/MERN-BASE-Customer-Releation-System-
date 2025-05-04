// DocumentsHighlightsEB.js
import React from "react";

const DocumentsHighlightsEB = ({
  checklist,
  handleChecklistChange,
  handleSaveChecklist,
  client,
  editingEBId,
  editingEBData,
  handleEBEditChange,
  handleSaveEBEdit,
  handleDeleteEB,
  ebData,
  handleEBChange,
  handleAddEB,
  showAddEB,
  setShowAddEB,
  editingHighlightId,
  editingHighlightData,
  handleHighlightEditChange,
  handleSaveHighlightEdit,
  handleDeleteHighlight,
  newHighlight,
  handleHighlightChange,
  highlightExpiryDate,
  handleExpiryDateChange,
  handleAddHighlight,
  showAddHighlight,
  setShowAddHighlight
}) => {
  return (
    <div className="w-1/2 p-6 border border-gray-300 rounded-lg shadow-md bg-white ml-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Documents, Highlights & Submitted Endorsementbody
      </h2>
      <div className="space-y-2">
        <div>
          <ul className="list-disc pl-5 mt-2">
            {Object.keys(checklist).map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                {item !== "ChecklistCompleted" && (
                  <input
                    type="checkbox"
                    checked={checklist[item].value || false}
                    onChange={() => handleChecklistChange(item)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                )}
                <span
                  className={`ml-2 ${
                    checklist[item].value && item !== "ChecklistCompleted"
                      ? "line-through text-gray-500"
                      : ""
                  }`}
                >
                  {item === "ChecklistCompleted" ? (
                    "Checklist Completed"
                  ) : (
                    item
                  )}
                </span>
                {checklist[item].timestamp && (
                  <span className="text-gray-600 text-sm ml-4">
                    Last updated:{" "}
                    {new Date(checklist[item].timestamp).toLocaleString()}
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
          Submitted EB
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
                      <option value="Envestor">Envestor</option>
                      <option value="Innovater">Innovater</option>
                      <option value="UKES">UKES</option>
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
              <option value="">Select Endorsing Body</option>
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
                Add EB
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
            Add EB
          </button>
        )}
      </div>

      {/* Critical Highlights */}
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
                      <option value="Ilets Expiry">Ilets Expiry</option>
                      <option value="Process Timeline">Process Timeline</option>
                      <option value="Residency Visa Expiry">
                        Residency Visa Expiry
                      </option>
                    </select>
                    <input
                      type="date"
                      name="expiryDate"
                      value={highlight.ExpiryDate}
                      onChange={handleExpiryDateChange}
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
                    <div>{highlight.highlight}</div>
                    <div className="text-sm text-gray-500">
                      Expiry Date: {new Date(highlight.ExpiryDate).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingHighlightId(highlight._id);
                          setEditingHighlightData({
                            highlight: highlight.highlight,
                            ExpiryDate: highlight.ExpiryDate,
                          });
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHighlight(highlight._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
        </ul>
      </div>

      {/* Add Critical Highlight */}
      <div className="mt-6">
        {showAddHighlight ? (
          <div className="mt-4">
            <select
              name="highlight"
              value={newHighlight.highlight}
              onChange={handleHighlightChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Select Highlight</option>
              <option value="Kids 18+">Kids 18+</option>
              <option value="Ilets Expiry">Ilets Expiry</option>
              <option value="Process Timeline">Process Timeline</option>
              <option value="Residency Visa Expiry">
                Residency Visa Expiry
              </option>
            </select>
            <input
              type="date"
              name="expiryDate"
              value={highlightExpiryDate}
              onChange={handleExpiryDateChange}
              className="block w-full p-3 border border-gray-300 rounded-lg mt-2"
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
  );
};

export default DocumentsHighlightsEB;
