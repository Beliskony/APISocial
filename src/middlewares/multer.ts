import multer from 'multer';

const storage = multer.memoryStorage(); // on garde en mémoire
const upload = multer({ storage });

export default upload;
