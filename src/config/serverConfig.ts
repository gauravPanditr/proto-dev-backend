import dotenv from 'dotenv';
import path from "path";

dotenv.config();

if (!process.env.REACT_PROJECT_COMMAND) {
  throw new Error("REACT_PROJECT_COMMAND is missing in .env file");
}


export const PROJECTS_ROOT = path.join(process.cwd(), "projects");
export const PORT = process.env.PORT || 3000;
export const REACT_PROJECT_COMMAND=process.env.REACT_PROJECT_COMMAND ;
