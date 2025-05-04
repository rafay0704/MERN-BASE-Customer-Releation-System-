import mongoose from 'mongoose';

const AllClientsSchema = new mongoose.Schema({
  Mou_no: { type: String, required: true },
  CustomerName: { type: String, required: true },
  Date: { type: String },
  VisaCatagory: { type: String },
  Phone: { type: String },
  Mobile: { type: String },
  Email: { type: String },
  Nationality: { type: String },
  BranchLocation: { type: String },
  SalesAdvisor: { type: String },
  CSS: { type: String },
  Status: { type: String },
   RecentComments: { type: String },
  Comment: { type: String },
  CGID: { type: String },
  Password: { type: String },
  ScreenshotsTaken: { type: String },
  Industry: { type: String },
  Stage: { type: String },
 
  StageHistory: [{
    newStage: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }],

  Language: { type: String , default: null},
  InvestmentFund: { type: Number, default: 0 }, // Add the new field with a default value of 0

  // New fields
  LatestComments: [{
    timestamp: { type: Date, default: Date.now },
    comment: { type: String },
    name: { type: String } // Name of the user who added the comment
  }],
  
  CriticalHighlights: [{
    criticalHighlight: { type: String },
    expiryDate: { type: Date },
    status: { type: String, enum: ['catered', 'not catered'], default: 'not catered' },
    statusTimestamp: { type: Date, default: null }, // Timestamp for status update (default null)
    AdminCheck: { type: Boolean, default: false },
    adminCheckTimestamp: { type: Date, default: null }, // Timestamp for admin check (default null)
    addedTimestamp: { type: Date, default: Date.now } // Timestamp when the critical highlight was added
  }],
  
  Commitments: [{
    commitment: { type: String, required: true },
    deadline: { type: Date, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['done', 'not done'], default: 'not done' },
    statusTimestamp: { type: Date, default: null }, // Timestamp for status update (default null)
    AdminCheck: { type: Boolean, default: false },
    adminCheckTimestamp: { type: Date, default: null }, // Timestamp for admin check (default null)
    addedTimestamp: { type: Date, default: Date.now } // Timestamp when the commitment was added
  }],


  Checklist: {
    PassportValidity: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    Selfie: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    Identification: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    LinkedIn: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    ResidentialProof: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    CV: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    BankStatement: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    DomainEvidence: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    EduQualification: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    ProfQualification: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    BusinessPlan: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    FinancialPlan: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    ChecklistCompleted: {
      value: { type: Boolean, default: false },
      timestamp: { type: Date }
    }
  },

  
  DocumentFolder: { type: String }, // Path to document folder
  
  SubmittedEB: [{
    EB: { type: String },
    Result: { type: String },
    Date: { type: Date }
  }],

  oldCSS: {
    CSS: { type: String }, // The initial CSS value at the time of upload
    Date: { type: Date }   // The date when the initial CSS was first uploaded
  },

  ShiftCSS: [{
    NewCSS: { type: String },
    Date: { type: Date }
  }],
  

   // Flag field with default value "yellow"
   Flag: {
    type: String,
    enum: ["yellow", "red", "green"],
    default: "yellow"
  } ,
  
 

   // New PinnedStatus field to track whether the client is pinned or not
   PinnedStatus: {
    type: String,
    enum: ['pinned', 'unPinned'],
    default: 'unPinned'
  }

 
});

const AllClientsModel = mongoose.model('AllClients', AllClientsSchema);

export default AllClientsModel;
