
import { Class } from '../types';

let classes: Class[] = [];

// Update classes reference for storage event listener
export const updateClassesReference = (newClasses: Class[]) => {
  classes = newClasses;
};
