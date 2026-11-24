// types.d.ts

// This tells TypeScript that the 'colors' module modifies the String prototype
import "colors";

declare global {
  namespace Express {
    interface Request {
      user?: any; // You can change 'any' to your IUser interface later
    }
  }
}

// Augment the String interface to include colors properties
declare interface String {
  bgCyan: string;
  blue: string;
  red: string;
  green: string;
  yellow: string;
  underline: string;
  bold: string;
}