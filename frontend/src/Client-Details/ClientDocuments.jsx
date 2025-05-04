import React, { useState, useEffect } from "react";
import { FaUpload, FaFile,FaInfoCircle, FaDownload, FaFolderOpen, FaChevronDown, FaChevronRight, FaCopy, FaAd, FaArchive, FaWindowRestore, FaTh, FaList } from "react-icons/fa";
import JSZip from 'jszip';
import { saveAs } from "file-saver";
import GuidelineModal from "../Modals/GuidelineModal";
import CommitmentsPopup from "../Modals/CommitmentsPop";
const ClientDocuments = ({
  handleFileChange,
  handleFolderChange,
  handleUploadDocument,
  uploadMessage,
  selectedFolder,
  documents,
  selectedFiles,
  handleSelectFile,
  handleAddSubmission,
  handleCopyFiles,
  selectedMainFolder ,
  handleMainFolderChange , 
  handleSubFolderChange ,
  subFolderOptions, 

}) => {
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false);
  const [folderOptions, setFolderOptions] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedSubfolders, setExpandedSubfolders] = useState({});
  const [downloadChoice, setDownloadChoice] = useState(null);
  const [viewMode, setViewMode] = useState("grid");


   // Automatically select the last main folder if available
   useEffect(() => {
    if (documents && Object.keys(documents).length > 0) {
      const lastFolder = Object.keys(documents)[Object.keys(documents).length - 1];
      handleMainFolderChange({ target: { value: lastFolder } });  // Automatically select last folder
    }
  }, [documents]);

  useEffect(() => {
    if (documents) {
      setFolderOptions(Object.keys(documents));
    }
  }, [documents]);

  const toggleFolder = (folder) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  const toggleSubfolder = (folder, subfolder) => {
    setExpandedSubfolders((prev) => ({
      ...prev,
      [`${folder}-${subfolder}`]: !prev[`${folder}-${subfolder}`],
    }));
  };


  const handleDownloadChoice = (choice) => {
    setDownloadChoice(choice);
    if (choice === 'zip') {
      handleDownloadZipFiles();
    } else {
      handleDownloadIndividualFiles();
    }
  };

  const handleDownloadZipFiles = async () => {
    const zip = new JSZip();
    const fetchPromises = [];
    
    // Download files from the selected main folder and subfolders
    const selectedFolderObj = documents[selectedMainFolder] || {};
    const selectedSubfolderObj = selectedFolderObj[selectedFolder] || {};
    const folderFiles = selectedSubfolderObj?.files?.filter(file => selectedFiles.includes(file));
    
    if (folderFiles && folderFiles.length > 0) {
      const folderZip = zip.folder(selectedFolder);
      folderFiles.forEach((file) => {
        const fetchPromise = fetch(`${import.meta.env.VITE_BACKEND_URL}/api/documents/${file}`)
          .then((res) => res.blob())
          .then((blob) => {
            folderZip.file(file.split("/").pop(), blob);
          });
        fetchPromises.push(fetchPromise);
      });
    }

    await Promise.all(fetchPromises);
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "Selected_Documents.zip");
    });
  };
  const handleDownloadIndividualFiles = () => {
    selectedFiles.forEach((file) => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/documents/${file}`)
        .then((res) => res.blob())
        .then((blob) => {
          saveAs(blob, file.split("/").pop());
        });
    });
  };

// Function to count files in a specific subfolder
const countFilesInSubfolder = (folder, subfolder) => {
  return documents[folder][subfolder]?.files?.length || 0;
};
// Function to count files across all subfolders within a folder
const countFilesInSubfolders = (folder) => {
  let totalFiles = 0;
  if (documents[folder]) {
    Object.keys(documents[folder]).forEach((subfolder) => {
      totalFiles += countFilesInSubfolder(folder, subfolder);
    });
  }
  return totalFiles;
};
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <CommitmentsPopup/>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-2xl font-semibold text-gray-800">Upload Client Document</h3>
      <button
        onClick={() => setIsGuidelineOpen(true)}
        className="text-blue-600 hover:text-blue-800"
        title="View Guidelines"
      >
        <FaInfoCircle size={24} />
      </button>
    </div>
    <GuidelineModal
        isOpen={isGuidelineOpen}
        onClose={() => setIsGuidelineOpen(false)}
        title="Guidelines for Managing Documents"
      >
        <ul className="list-disc pl-5 space-y-2">
          <li>Select files and folders carefully before performing actions.</li>
          <li>Ensure to upload only approved document formats.</li>
          <li>Use the "Copy" button to duplicate files into other folders.</li>
          <li>To download multiple files, select and use "ZIP Download" for convenience.</li>
          <li>To download multiple files, select and use "ZIP Download" for convenience.</li>
          <li>To download multiple files, select and use "ZIP Download" for convenience.</li>
        </ul>
      </GuidelineModal>

      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={handleAddSubmission}
          className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-all"
        >
          <FaAd className="inline mr-2" /> Add Submission
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="p-2 border border-gray-300 rounded-lg shadow-sm"
          />
<select value={selectedMainFolder} onChange={handleMainFolderChange} className="p-2 border border-gray-300 rounded-lg shadow-sm">
  {folderOptions.map((folder, index) => (
    <option key={index} value={folder}>{folder}</option>
  ))}
</select>

{subFolderOptions.length > 0 && (
  <select value={selectedFolder} onChange={handleSubFolderChange} className="p-2 border border-gray-300 rounded-lg shadow-sm">
    {subFolderOptions.map((subfolder, index) => (
      <option key={index} value={subfolder}>{subfolder}</option>
    ))}
  </select>
)}


         
          <button
            onClick={handleUploadDocument}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all"
          >
            <FaUpload className="inline mr-2" /> Upload
          </button>
          <button
            onClick={handleCopyFiles}
            className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition-all"
          >
            <FaCopy className="inline mr-2" /> Copy
          </button>
        </div>
      </div>

      {/* Download Options */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setDownloadChoice((prev) => prev === null ? 'zip' : null)}
          className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-all flex items-center"
        >
          <FaDownload className="inline mr-2" /> Download
        </button>

        {downloadChoice !== null && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDownloadChoice('zip')}
              className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center"
            >
              <FaArchive className="inline mr-2" /> ZIP File
            </button>
            <button
              onClick={() => handleDownloadChoice('individual')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-full flex items-center"
            >
              <FaWindowRestore className="inline mr-2" /> Individual Files
            </button>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-full ${viewMode === "grid" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          <FaTh />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-full ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          <FaList />
        </button>
      </div>

      {/* Display Files */}
      {uploadMessage && (
        <div className="text-green-600 font-semibold mb-4">{uploadMessage}</div>
      )}

<div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">Client Documents Folders</h3>
       
      </div>
     

      {/* Folder Structure */}
      {folderOptions.length > 0 ? (
        <div className="space-y-4">
          {folderOptions.map((folder, index) => (
            <div key={index} className="border-b pb-4">
              <div
                className="flex items-center cursor-pointer space-x-2 text-lg font-semibold text-gray-700"
                onClick={() => toggleFolder(folder)}
              >
                {expandedFolders[folder] ? <FaChevronDown /> : <FaChevronRight />}
                <FaFolderOpen className="text-yellow-500" />
                <span>{folder} ({countFilesInSubfolders(folder)} files)</span>
              </div>
              
              {expandedFolders[folder] && (
                <div className="ml-8 mt-2 space-y-2">
                  {Object.keys(documents[folder]).map((subfolder, subIndex) => (
  <div key={subIndex}>
    <div
      className="flex items-center cursor-pointer space-x-2 text-gray-600"
      onClick={() => toggleSubfolder(folder, subfolder)}
    >
      {expandedSubfolders[`${folder}-${subfolder}`] ? <FaChevronDown /> : <FaChevronRight />}
      <FaFolderOpen className="text-green-500" />
      <span>{subfolder} ({countFilesInSubfolder(folder, subfolder)} files)</span>
      </div>
    {expandedSubfolders[`${folder}-${subfolder}`] && (
      <div className={viewMode === "grid" ? "grid grid-cols-3 gap-4 mt-2" : "list-disc pl-8 mt-2 space-y-2"}>
        {documents[folder][subfolder]?.files?.length > 0 ? (
          documents[folder][subfolder].files.map((file, fileIndex) => (
            <div key={fileIndex} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFiles.includes(file)}
                onChange={() => handleSelectFile(file)}
                className="form-checkbox"
              />
              <a
                href={`${import.meta.env.VITE_BACKEND_URL}/api/documents/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {file.split("/").pop()}
              </a>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No files in this folder</div>
        )}
      </div>
    )}
  </div>
))}

                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No documents available.</p>
      )}
    </div>
  );
};

export default ClientDocuments;