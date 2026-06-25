import  child_Process  from "child_process";
import util from 'util'

export const execPromisified=util.promisify(child_Process.exec)