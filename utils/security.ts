
import CryptoJS from 'crypto-js';
import { DATA_KEY } from '../constants';

/**
 * Decrypts an AES-encrypted string and parses it as JSON.
 * If parsing fails (e.g. data is already JSON), it returns the parsed object.
 */
export const decryptJSON = <T>(ciphertext: string): T | null => {
  if (!ciphertext) return null;

  try {
    // 1. Try to decrypt
    const bytes = CryptoJS.AES.decrypt(ciphertext, DATA_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    // 2. If decryption yields empty string, it might be plain JSON or wrong key
    if (!decryptedText) {
       // Fallback: Try parsing raw text (in case encryption wasn't applied yet)
       try {
         return JSON.parse(ciphertext) as T;
       } catch {
         throw new Error("Decryption failed and not valid JSON");
       }
    }

    return JSON.parse(decryptedText) as T;
  } catch (e) {
    console.warn("Data decryption failed. Attempting to parse as plain JSON...", e);
    // Fallback attempt for development environment
    try {
        return JSON.parse(ciphertext) as T;
    } catch (parseError) {
        console.error("Failed to parse data.", parseError);
        return null;
    }
  }
};
