// middlewares/formParser.ts
import multer from "multer";
export const formParser = multer().none(); // Pas de fichiers, juste les champs

export const formParserMedia = multer().fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 2 }
]);
