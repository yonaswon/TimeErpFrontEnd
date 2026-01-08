"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface SidebarContextType {
  isOpen: boolean;
  content: ReactNode;
  title: string;
  openSidebar: (content: ReactNode, title?: string) => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [title, setTitle] = useState("");

  const openSidebar = useCallback(
    (newContent: ReactNode, newTitle: string = "") => {
      setContent(newContent);
      setTitle(newTitle);
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    },
    []
  );

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setContent(null);
      setTitle("");
      document.body.style.overflow = "unset";
    }, 300);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, content, title, openSidebar, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
