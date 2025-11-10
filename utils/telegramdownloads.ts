// utils/telegramDownload.ts
import { downloadFile } from "./cuttingfileutils";
// declare global {
//   interface Window {
//     Telegram?: {
//       WebApp: {
//         downloadFile: (url: string, fileName?: string) => void;
//         openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
//         showAlert: (message: string, callback?: () => void) => void;
//       };
//     };
//   }
// }

export const downloadFileInTelegram = async (url: string, filename: string) => {
  if (window.Telegram?.WebApp) {
    try {
      // Method 1: Use Telegram's downloadFile (if available)
      if (window.Telegram.WebApp.downloadFile) {
        window.Telegram.WebApp.downloadFile(url, filename);
        return;
      }
      
      // Method 2: Open in external browser
      window.Telegram.WebApp.openLink(url);
      
    } catch (error) {
      console.error('Telegram download failed:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  } else {
    // Fallback for non-Telegram environment
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};