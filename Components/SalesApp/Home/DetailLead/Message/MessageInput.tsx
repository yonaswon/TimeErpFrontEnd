"use client";
import { useState, useRef } from "react";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import api from "@/api";

interface MessageInputProps {
  mockupId?: number;
  mockupModificationId?: number;
  currentUserId?: number;
  leadId: number;
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
      <div className="flex gap-2">
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:bg-gray-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400 shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
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

        {/* Message Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 resize-none border border-gray-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={sending || (!message.trim() && selectedImages.length === 0)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors shrink-0"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Sending: {sending ? 'Yes' : 'No'} | 
          User: {currentUserId ? 'Yes' : 'No'} | 
          Images: {selectedImages.length}
        </div>
      )}
    </div>
  );
}