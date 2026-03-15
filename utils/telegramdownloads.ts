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
  try {
    if (window.Telegram?.WebApp) {
      // 1. Try native Telegram WebApp download functionality (requires object params)
      if (typeof window.Telegram.WebApp.downloadFile === 'function') {
        try {
          // New Telegram SDKs expect an object format
          window.Telegram.WebApp.downloadFile({ url, file_name: filename });
          return;
        } catch (tgError) {
          console.warn('Native downloadFile error:', tgError);
          // Fall back to Blob download if native API fails
        }
      }
    }

    // 2. Fetch as Blob and create local anchor url fallback (cross-origin supported if CORS headers exist)
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);

  } catch (error) {
    console.error('Download failed:', error);

    // 3. Absolute fallback: open in new tab
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
};