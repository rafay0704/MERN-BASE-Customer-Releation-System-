import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';

Modal.setAppElement('#root');

const ClientModal = ({ isOpen, modalData, closeModal, modalType, handleModalSave }) => {
    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '40px',
            fontSize: '14px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 5,
        }),
        option: (provided) => ({
            ...provided,
            fontSize: '14px',
        }),
    };

    // State variables for options
    const [languageOptions, setLanguageOptions] = useState([]);
    const [nationalityOptions, setNationalityOptions] = useState([]);
    const [industryOptions, setIndustryOptions] = useState([
        { value: 'Chemical', label: 'Chemical' },
        { value: 'Electrical', label: 'Electrical' },
        { value: 'Software', label: 'Software' },
        { value: 'IT', label: 'IT' },
        { value: 'Facility', label: 'Facility Management' },
        { value: 'Law', label: 'Law' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Real Estate', label: 'Real Estate' },
        { value: 'Education', label: 'Education' },
        { value: 'Automotive', label: 'Automotive' },
        { value: 'Retail', label: 'Retail' },
        { value: 'Hospitality', label: 'Hospitality' },
        { value: 'Construction', label: 'Construction' },
        { value: 'Transportation', label: 'Transportation' },
        { value: 'Telecommunications', label: 'Telecommunications' },
        { value: 'Entertainment', label: 'Entertainment' },
        { value: 'Tourism', label: 'Tourism' },
        { value: 'Government', label: 'Government' },
        { value: 'Aerospace', label: 'Aerospace' },
        { value: 'Agriculture', label: 'Agriculture' },
        { value: 'Mining', label: 'Mining' },
        { value: 'Pharmaceutical', label: 'Pharmaceutical' },
        { value: 'Insurance', label: 'Insurance' },
        { value: 'Banking', label: 'Banking' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Food & Beverage', label: 'Food & Beverage' },
        { value: 'Media', label: 'Media' },
        { value: 'Logistics', label: 'Logistics' },
        { value: 'Security', label: 'Security' },
        { value: 'Consulting', label: 'Consulting' },
        { value: 'Non-profit', label: 'Non-profit' },
        { value: 'Sports', label: 'Sports' },
        { value: 'Architecture', label: 'Architecture' },
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Textiles', label: 'Textiles' },
        { value: 'Beauty', label: 'Beauty' },
        { value: 'Media & Publishing', label: 'Media & Publishing' },
        { value: 'Renewable Energy', label: 'Renewable Energy' },
        { value: 'Luxury Goods', label: 'Luxury Goods' },
        { value: 'Printing', label: 'Printing' },
        { value: 'Petroleum', label: 'Petroleum' },
        { value: 'Sports & Recreation', label: 'Sports & Recreation' },
        { value: 'Consumer Goods', label: 'Consumer Goods' },
        { value: 'Real Estate Investment', label: 'Real Estate Investment' },
        { value: 'E-commerce', label: 'E-commerce' },
        { value: 'Blockchain', label: 'Blockchain' },
        { value: 'Cryptocurrency', label: 'Cryptocurrency' },
        { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
        { value: 'Blockchain', label: 'Blockchain' },
        { value: 'Music', label: 'Music' },
        { value: 'Publishing', label: 'Publishing' },
        { value: 'Veterinary', label: 'Veterinary' },
        { value: 'Biotechnology', label: 'Biotechnology' },
        { value: 'Farming', label: 'Farming' },
        { value: 'Media Production', label: 'Media Production' },
        { value: 'Art & Design', label: 'Art & Design' },
        { value: 'Public Relations', label: 'Public Relations' },
        { value: 'Social Services', label: 'Social Services' },
        { value: 'Event Management', label: 'Event Management' },
        { value: 'Human Resources', label: 'Human Resources' },
        { value: 'Recruitment', label: 'Recruitment' },
        { value: 'Technology Consulting', label: 'Technology Consulting' },
        { value: 'Legal Services', label: 'Legal Services' },
        { value: 'Data Analytics', label: 'Data Analytics' },
        { value: 'Digital Marketing', label: 'Digital Marketing' },
        { value: 'Cybersecurity', label: 'Cybersecurity' },
        { value: 'Cloud Computing', label: 'Cloud Computing' },
        { value: '3D Printing', label: '3D Printing' },
        { value: 'Robotics', label: 'Robotics' },
        { value: 'UX/UI Design', label: 'UX/UI Design' },
        { value: 'Mobile App Development', label: 'Mobile App Development' },
        { value: 'Software Development', label: 'Software Development' },
        { value: 'Web Development', label: 'Web Development' },
        { value: 'Virtual Reality', label: 'Virtual Reality' },
        { value: 'Augmented Reality', label: 'Augmented Reality' },
        { value: 'Gaming', label: 'Gaming' },
        { value: 'AI & Machine Learning', label: 'AI & Machine Learning' },
        { value: 'Wearables', label: 'Wearables' },
        { value: 'Quantum Computing', label: 'Quantum Computing' },
        { value: 'Healthtech', label: 'Healthtech' },
        { value: 'Medtech', label: 'Medtech' },
        { value: 'CleanTech', label: 'CleanTech' },
        { value: 'PropTech', label: 'PropTech' },
        { value: 'Fintech', label: 'Fintech' },
        { value: 'Edtech', label: 'Edtech' },
        { value: 'Martech', label: 'Martech' },
    ]);
    
        const [stageOptions] = useState([
        { value: 'Active', label: 'Active' },
        { value: 'Endorsed', label: 'Endorsed' },
        { value: 'Endorsement Failed', label: 'Endorsement Failed' },
        { value: 'Visa Rejected', label: 'Visa Rejected' },
        { value: 'Visa Granted', label: 'Visa Granted' },
        { value: 'Switched Out', label: 'Switched Out' },
        { value: 'Court Case', label: 'Court Case' },
        { value: 'Refunded', label: 'Refunded' },
        { value: 'COS Issued', label: 'COS Issued' },
    ]);


    const [statusOptions] = useState([
        { value: 'Unresponsive', label: 'Unresponsive' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Under Investment', label: 'Under Investment' },
        { value: 'Switching In Progress', label: 'Switching In Progress' },
        { value: 'Refund Request', label: 'Refund Request' },
        { value: 'Orientation Not Done', label: 'Orientation Not Done' },
        { value: 'Orientation Done', label: 'Orientation Done' },
        { value: 'CV & Questionnaire Received', label: 'CV & Questionnaire Received' },
        { value: 'Business Plan Required', label: 'Business Plan Required' },
        { value: 'BP Initial Draft Created', label: 'BP Initial Draft Created' },
        { value: 'BP Initial Draft Review Done', label: 'BP Initial Draft Review Done' },
        { value: 'BP Initial Draft Updated 1', label: 'BP Initial Draft Updated 1' },
        { value: 'BP Initial Draft Review Verification Done', label: 'BP Initial Draft Review Verification Done' },
        { value: 'BP Initial Draft Sent To Client', label: 'BP Initial Draft Sent To Client' },
        { value: 'BP Initial Draft Client Feedback', label: 'BP Initial Draft Client Feedback' },
        { value: 'BP Initial Draft Updated 2', label: 'BP Initial Draft Updated 2' },
        { value: 'BP Initial Draft Approved By Client', label: 'BP Initial Draft Approved By Client' },
        { value: 'Supporting Documents Received', label: 'Supporting Documents Received' },
        { value: 'BP Final Draft Created', label: 'BP Final Draft Created' },
        { value: 'BP Final Draft Review Done', label: 'BP Final Draft Review Done' },
        { value: 'BP Final Draft Updated 3', label: 'BP Final Draft Updated 3' },
        { value: 'BP Final Draft Review Verification Done', label: 'BP Final Draft Review Verification Done' },
        { value: 'BP Final Draft Sent To Client', label: 'BP Final Draft Sent To Client' },
        { value: 'BP Final Draft Client Feedback', label: 'BP Final Draft Client Feedback' },
        { value: 'BP Final Draft Updated 4', label: 'BP Final Draft Updated 4' },
        { value: 'BP Final Draft Approved By Client', label: 'BP Final Draft Approved By Client' },
        { value: 'Training Sessions Completed', label: 'Training Sessions Completed' },
        { value: 'Need To Submit Documents Received', label: 'Need To Submit Documents Received' },
        { value: 'Endorsement Application Submitted', label: 'Endorsement Application Submitted' },
        { value: 'Endorsement Application Rejected', label: 'Endorsement Application Rejected' },
        { value: 'Endorsement Application Appeal', label: 'Endorsement Application Appeal' },
        { value: 'Other', label: 'Other' },
    ]);

    useEffect(() => {
        // Fetch languages and nationalities from the REST Countries API
        const fetchData = async () => {
            try {
                // Fetch country data
                const countriesResponse = await fetch('https://restcountries.com/v3.1/all');
                const countries = await countriesResponse.json();

                // Extract languages and nationalities
                const languages = new Set();
                const nationalities = new Set();

                countries.forEach(country => {
                    // Add languages
                    if (country.languages) {
                        Object.values(country.languages).forEach(language => languages.add(language));
                    }
                    // Add nationality (common name for the country)
                    nationalities.add(country.name.common);
                });

                // Set the state with fetched values
                setLanguageOptions([...languages].map(lang => ({ value: lang, label: lang })));
                setNationalityOptions([...nationalities].map(nat => ({ value: nat, label: nat })));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Edit Dropdown"
            className="p-8 bg-white rounded-lg shadow-2xl w-full max-w-xl mx-auto mt-20 transform transition-all duration-300 ease-in-out scale-95 hover:scale-100"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
            <h2 className="text-3xl mb-6 text-center font-semibold text-gray-900">
                Edit {modalType}
            </h2>

            {modalType === 'status' || modalType === 'stage' ? (
                <Select
                    options={modalType === 'status' ? statusOptions : stageOptions}
                    value={
                        modalType === 'status'
                            ? statusOptions.find(option => option.value === modalData.Status)
                            : stageOptions.find(option => option.value === modalData.Stage)
                    }
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'language' ? (
                <Select
                    options={languageOptions}
                    value={languageOptions.find(option => option.value === modalData.Language)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'nationality' ? (
                <Select
                    options={nationalityOptions}
                    value={nationalityOptions.find(option => option.value === modalData.Nationality)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : modalType === 'industry' ? (
                <Select
                    options={industryOptions}
                    value={industryOptions.find(option => option.value === modalData.Industry)}
                    onChange={handleModalSave}
                    styles={customStyles}
                />
            ) : null}
            

            <div className="mt-8 flex justify-between items-center">
                <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 ease-in-out"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
};

export default ClientModal;
