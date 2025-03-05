"use client";
import React, { useState, useRef, useEffect } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { Client } from "@langchain/langgraph-sdk";
import "./App.css";

// 1) Define a wrapper type that includes `additional_kwargs`
type ExtendedMessage = Message & {
  additional_kwargs?: {
    geolocation?: any;
    is_link?: boolean;
    display: boolean;
    complete?: boolean;
  };
};

const App: React.FC = () => {
  const apiUrl = import.meta.env.VITE_DEPLOYMENT_URL;
  const apiKey = import.meta.env.VITE_LANGSMITH_API_KEY;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);
  const messageContainer = useRef<HTMLDivElement>(null);

  const initializeThread = async () => {
    if (!localStorage.getItem("chatbot-thread-id")) {
      const client = new Client({ apiUrl: apiUrl, apiKey: apiKey });
      const new_thread = await client.threads.create();
      localStorage.setItem("chatbot-thread-id", new_thread["thread_id"]);
    }
  };

  useEffect(() => {
    initializeThread();
  }, []);

  // 2) Use `ExtendedMessage` in the `useStream` hook:
  const thread = useStream<{ messages: ExtendedMessage[] }>({
    apiUrl: apiUrl,
    apiKey: apiKey,
    assistantId: "chatbot",
    messagesKey: "messages",
    threadId: localStorage.getItem("chatbot-thread-id"),
  });

  const toggleChatbox = () => {
    setIsOpen((prev) => !prev);
  };

  const scrollToBottom = () => {
    if (messageContainer.current) {
      messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [isOpen, thread.messages]);

  useEffect(() => {
    // 3) Safely check `additional_kwargs` with a type assertion:
    if (
      thread.messages.length > 0 &&
      (thread.messages[thread.messages.length - 1] as ExtendedMessage).additional_kwargs?.geolocation
    ) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          if(!thread.isLoading) {
            thread.submit({
              messages: [{ type: "human", content: "Latitude: "+latitude+",Longitude: "+longitude, additional_kwargs: {display:false} }],
            });
          }
        },
        function (error) {
          console.error("Error getting location: " + error.message);
        }
      );
    }
  }, [thread.messages])

  const submitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get("message") as string;
    form.reset();
    thread.submit({
      messages: [{ type: "human", content: message }],
    });
  };

  return (
    <div className="fixed bottom-4 right-4">
      {isOpen && (
        <div className="mt-4 w-120 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden transition-opacity duration-100 opacity-100">
          {/* Chat Header */}
          <div className="bg-blue-500 p-4">
            <h2 className="text-white text-lg font-semibold">Aposto Chatbot</h2>
          </div>

          {/* Chat Messages Area */}
          <div className="p-4 h-120 overflow-y-auto space-y-4" ref={messageContainer}>
            {thread.messages.map((message, index) => {
              return (
                <div
                  key={index}
                  className={`flex items-start ${message.type === "human" ? "justify-end" : ""}`}
                >
                  {
                  message.type === "ai" && 
                  !(message as ExtendedMessage).additional_kwargs?.is_link && 
                  (message as ExtendedMessage).additional_kwargs?.complete==true && (
                    <div className="bg-gray-200 text-gray-900 p-2 rounded-lg max-w-100">
                      <p dangerouslySetInnerHTML={{__html: message.content as unknown as string}}></p>
                    </div>
                  )}
  
                  {
                  message.type === "ai" && 
                  (message as ExtendedMessage).additional_kwargs?.is_link &&
                  (message as ExtendedMessage).additional_kwargs?.complete==true && (
                    <a
                      target="_blank"
                      href={message.content as string}
                      className="text-blue-500 hover:underline"
                    >
                      {message.content as unknown as React.ReactNode}
                    </a>
                  )}
  
                  {message.type === "human" && (message as ExtendedMessage).additional_kwargs?.display!=false && (
                    <div className="bg-blue-500 text-white p-2 rounded-lg max-w-100">
                      <p>{message.content as unknown as React.ReactNode}</p>
                    </div>
                  )}
                </div>
              )
            } )}
            <div ref={bottomMarkerRef} />
          </div>

          {/* Chat Input */}
          <form className="border-t p-4 flex relative" onSubmit={submitMessage}>
            {thread.isLoading && (
              <div className="absolute -top-10">
                <div className="text-gray-900 p-2 rounded-lg max-w-xs">
                  <p>typing...</p>
                </div>
              </div>
            )}
            <textarea
              placeholder="Type your message..."
              name="message"
              rows={3}
              autoComplete="off"
              className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none resize-y"
            />

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 transform -rotate-45"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Chatbox Button */}
      <button
        onClick={toggleChatbox}
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded-full shadow-lg hover:bg-blue-600 transition float-right"
      >
        {isOpen && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {!isOpen && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.97-4.03 9-9 9a9.92 9.92 0 01-4-.93L3 21l1.93-4.07A8.959 8.959 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;
