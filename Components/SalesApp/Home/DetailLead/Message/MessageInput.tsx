"use client";
import { useState, useRef } from "react";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import api from "@/api";

interface MessageInputProps {
  mockupId?: number;
  mockupModificationId?: number;
  currentUserId?: number;
  leadId: number;
  onMessageSent?: () => void;
}

interface SelectedImage {
  file: File;
  preview: string;
}

export default function MessageInput({
  mockupId,
  mockupModificationId,
  currentUserId,
  leadId,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: SelectedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    setSelectedImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const sendMessage = async () => {
    // Early validation
    if ((!message.trim() && selectedImages.length === 0) || !currentUserId) {
      console.log('Validation failed: no content or user');
      return;
    }

    console.log('Starting to send message...');
    setSending(true);

    try {
      const formData = new FormData();

      // Add required fields
      formData.append('message', message.trim() || '');
      formData.append('sender', currentUserId.toString());

      // Add optional fields
      if (mockupId) {
        formData.append('mockup', mockupId.toString());
      }
      if (mockupModificationId) {
        formData.append('mockup_modification', mockupModificationId.toString());
      }

      // Add images
      selectedImages.forEach((image) => {
        formData.append('images', image.file);
      });

      console.log('Sending request to API...');

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await api.post('/lead/messages/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Message sent successfully:', response.data);

      // Clear input and images
      setMessage('');

      // Clean up image preview URLs
      selectedImages.forEach(image => URL.revokeObjectURL(image.preview));
      setSelectedImages([]);

      // Trigger refresh with error handling
      try {
        window.dispatchEvent(new CustomEvent('messageSent'));
        console.log('Refresh event dispatched');
      } catch (eventError) {
        console.warn('Could not dispatch event:', eventError);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);

      let errorMessage = 'Failed to send message';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      }

      alert(errorMessage);
    } finally {
      setSending(false);
      console.log('Send operation completed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        sendMessage();
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-zinc-800 p-4">
      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative shrink-0">
              <img
                src={image.preview}
                alt={`Selected ${index}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-zinc-600"
              />
              <button
                onClick={() => removeImage(index)}
                disabled={sending}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-2 bg-white dark:bg-[#202c33] max-w-3xl mx-auto w-full">
        {/* Image Upload Paperclip Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-[#8696a0] shrink-0 mb-1"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current" style={{ transform: 'rotate(45deg)' }}>
            <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.57.57 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path>
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          disabled={sending}
          className="hidden"
        />

        {/* Message Input Telegram Style */}
        <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-3xl flex items-end pl-4 pr-2 py-0 min-h-[44px] shadow-sm mb-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            disabled={sending}
            className="flex-1 w-full resize-none bg-transparent text-[15px] text-[#111b21] dark:text-[#d1d7db] placeholder-[#8696a0] focus:outline-none pt-2.5 pb-2.5 disabled:opacity-50"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Send Button Telegram Style */}
        {(message.trim() || selectedImages.length > 0) ? (
          <button
            onClick={sendMessage}
            disabled={sending}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white transition-colors shrink-0 mb-1 shadow-sm"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        ) : (
          <button
            disabled
            className="w-[42px] h-[42px] flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-[#8696a0] shrink-0 mb-1"
          >
            {/* Microphone placeholder icon */}
            <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.349 8.469 4.35v7.061c0 2.001 1.53 3.53-3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
}