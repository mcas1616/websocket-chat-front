import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const App = () => {
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (stompClient) {
      stompClient.onConnect = () => {
        setIsConnected(true);
        stompClient.subscribe('/topic/public', onMessageReceived);
        stompClient.publish({
          destination: '/app/chat.newUser',
          body: JSON.stringify({ sender: username, type: 'JOIN' }),
        });
      };
      stompClient.onStompError = (error) => {
        console.error('STOMP Error:', error);
      };
      stompClient.activate();
    }
  }, [stompClient, username]);

  const connectToChat = () => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });
    setStompClient(client);
  };

  const sendMessage = () => {
    if (message && stompClient) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ sender: username, content: message, type: 'CHAT' }),
      });
      setMessage('');
    }
  };

  const onMessageReceived = (message) => {
    const chatMessage = JSON.parse(message.body);
    setChatMessages((prevMessages) => [...prevMessages, chatMessage]);
  };

  return (
    <div>
      {!isConnected ? (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={connectToChat}>Join Chat</button>
        </div>
      ) : (
        <div>
          <div className="chat-window">
            {chatMessages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}: </strong>
                {msg.content}
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default App;
