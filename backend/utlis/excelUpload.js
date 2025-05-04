import multer from 'multer';
import path from 'path';


const excelUpload = multer({
  storage: multer.memoryStorage(), // Store the file in memory
  fileFilter: (req, file, cb) => {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                       'application/vnd.ms-excel', 
                       'text/csv'].includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only Excel and CSV files are allowed!');
    }
  },
});

export default excelUpload;
