import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiArrowLeft } from 'react-icons/hi';
import { FiPaperclip, FiLink2, FiMic, FiSquare, FiDownload, FiPlay, FiX, FiTrash2, FiCopy, FiUser } from 'react-icons/fi';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdSupportAgent } from 'react-icons/md';
import { TbChecks } from 'react-icons/tb';
import io from 'socket.io-client';
import { getActiveChatsApi, getChatMessagesApi, uploadChatFileApi, deleteChatMessageApi } from '../../services/allApi';
import { BASE_URL } from '../../services/baseUrl';

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: { isOnline, lastSeen } }
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaModal, setMediaModal] = useState({ isOpen: false, url: '', type: '' });
  const [activeMenu, setActiveMenu] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    // Initialize Socket
    const newSocket = io(BASE_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Fetch active chats for sidebar
    fetchActiveChats();

    // Join admin presence room
    newSocket.on('connect', () => {
      newSocket.emit('join_admin');
    });

    // Receive the snapshot of currently online users
    newSocket.on('online_users_list', (onlineIds) => {
      const map = {};
      onlineIds.forEach(id => { map[String(id)] = { isOnline: true, lastSeen: null }; });
      setOnlineUsers(map);
    });

    // Real-time individual status updates
    newSocket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers(prev => ({ ...prev, [String(userId)]: { isOnline, lastSeen } }));
    });


    // Real-time deletion
    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    // Messages read update
    newSocket.on('messages_read', ({ userId, readerType }) => {
      console.log('Messages read event received in Admin:', { userId, readerType });
      if (readerType === 'user') {
        setMessages(prev => {
          if (prev.length > 0 && String(prev[0].userId) === String(userId)) {
            console.log('Updating messages to read state in Admin');
            return prev.map(m => m.senderType === 'admin' ? { ...m, isRead: true } : m);
          }
          return prev;
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Single stable socket listener
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      const currentSelected = selectedUserRef.current;
      
      if (currentSelected && String(data.userId) === String(currentSelected.id)) {
        setMessages((prev) => {
          // 1. Remove any message that matches by tempId or real id
          const filtered = prev.filter(m => {
            const isMatch = (data.tempId && (m.tempId === data.tempId || m.id === data.tempId)) || 
                           (data.id && m.id === data.id);
            return !isMatch;
          });
          
          // 2. Check for fallback duplicate by content/sender/time (within 2s)
          const isDuplicate = filtered.some(m => 
            m.content === data.content && 
            m.senderType === data.senderType && 
            Math.abs(new Date(m.createdAt || m.created_at) - new Date(data.createdAt || data.created_at)) < 2000
          );
          
          if (isDuplicate) return filtered;

          // 3. Add and sort
          const newMessages = [...filtered, data];
          return newMessages.sort((a, b) => 
            new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at)
          );
        });
        scrollToBottom();
        // If message is from user, mark as read
        if (data.senderType === 'user') {
          socket.emit('mark_as_read', { userId: currentSelected.id, readerType: 'admin' });
        }
      } else {
        // Increment unread count for the user in sidebar
        setActiveUsers(prev => prev.map(chat => 
          String(chat.id) === String(data.userId) 
            ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1, lastMessage: data } 
            : chat
        ));
      }
      fetchActiveChats();
    };

    socket.on('receive_message', handleReceiveMessage);
    
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]); // Only depends on socket instance

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchActiveChats = async () => {
    try {
      const res = await getActiveChatsApi();
      if (res.status === 200) {
        setActiveUsers(res.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch active chats:', error);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    // Clear unread count locally
    setActiveUsers(prev => prev.map(chat => 
      chat.id === user.id ? { ...chat, unreadCount: 0 } : chat
    ));
    if (socket) {
      socket.emit('join_room', user.id);
    }
    try {
      const res = await getChatMessagesApi(user.id);
      if (res.status === 200) {
        setMessages(res.data.messages);
        // Mark all messages as read when opening chat
        if (socket) {
          socket.emit('mark_as_read', { userId: user.id, readerType: 'admin' });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (location.state?.selectedUser && socket) {
      const userToSelect = location.state.selectedUser;
      handleSelectUser(userToSelect);

      // If user not in activeUsers, add them to the top of the list
      setActiveUsers(prev => {
        if (!prev.find(u => String(u.id) === String(userToSelect.id))) {
          return [userToSelect, ...prev];
        }
        return prev;
      });
      
      // Clear state to avoid re-selection on refresh/navigation back
      window.history.replaceState({}, document.title);
    }
  }, [location.state, socket]);

  const filteredUsers = activeUsers.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendText = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !selectedUser) return;
    
    const tempId = `temp_${Date.now()}`;
    const payload = {
      tempId,
      senderId: 1,
      senderType: 'admin',
      receiverId: selectedUser.id,
      content: message,
      type: 'TEXT',
      userId: selectedUser.id,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    setMessages(prev => [...prev, { ...payload, id: tempId }]);
    socket.emit('send_message', payload);
    setMessage('');
    scrollToBottom();
  };

  const handleSendLink = () => {
    if (!linkUrl.trim() || !socket || !selectedUser) return;
    
    const tempId = `temp_${Date.now()}`;
    const payload = {
      tempId,
      senderId: 1,
      senderType: 'admin',
      receiverId: selectedUser.id,
      content: linkUrl,
      type: 'TEXT',
      userId: selectedUser.id,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    setMessages(prev => [...prev, { ...payload, id: tempId }]);
    socket.emit('send_message', payload);
    setLinkUrl('');
    setIsLinkModalOpen(false);
    scrollToBottom();
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser || !socket) return;
    
    let type = 'DOCUMENT';
    if (file.type.startsWith('image/')) type = 'IMAGE';
    if (file.type.startsWith('video/')) {
      type = 'VIDEO';
      const MAX_SIZE = 500 * 1024 * 1024; // 500MB
      if (file.size > MAX_SIZE) {
        alert('Video file size must be below 500MB');
        e.target.value = '';
        return;
      }
    }
    if (file.type.startsWith('audio/')) type = 'AUDIO';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadChatFileApi(formData, { "Content-Type": "multipart/form-data" });
      if (res.status === 200 && res.data.url) {
        const tempId = `temp_${Date.now()}`;
        const payload = {
          tempId,
          senderId: 1,
          senderType: 'admin',
          receiverId: selectedUser.id,
          content: res.data.url,
          type: type,
          userId: selectedUser.id,
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, { ...payload, id: tempId }]);
        socket.emit('send_message', payload);
        scrollToBottom();
      }
    } catch (error) {
      console.error('File upload failed', error);
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const res = await uploadChatFileApi(formData, { "Content-Type": "multipart/form-data" });
          if (res.status === 200 && res.data.url) {
            const tempId = `temp_${Date.now()}`;
            const payload = {
              tempId,
              senderId: 1,
              senderType: 'admin',
              receiverId: selectedUser.id,
              content: res.data.url,
              type: 'AUDIO',
              userId: selectedUser.id,
              createdAt: new Date().toISOString(),
              isRead: false
            };
            setMessages(prev => [...prev, { ...payload, id: tempId }]);
            socket.emit('send_message', payload);
            scrollToBottom();
          }
        } catch (error) {
          console.error('Voice upload failed', error);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDeleteMessage = async (msg) => {
    setActiveMenu(null);
    setMessages(prev => prev.filter(m => (m.id || m.tempId) !== (msg.id || msg.tempId)));
    if (msg.id && !String(msg.id).startsWith('temp_')) {
      try {
        await deleteChatMessageApi(msg.id);
        if (socket) socket.emit('delete_message', { messageId: msg.id, userId: msg.userId });
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  const handleCopyText = (content) => {
    navigator.clipboard.writeText(content).catch(() => {
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setActiveMenu(null);
  };

  const handleDownloadMedia = async (url, e) => {
    if (e) e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = url.split('/').pop() || 'download_media';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, opening in new tab', error);
      window.open(url, '_blank');
    }
    setActiveMenu(null);
  };

  const renderMessageContent = (msg, isAdmin) => {
    switch (msg.type) {
      case 'IMAGE':
        return <img src={msg.content} alt="Attachment" className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-white/5" onClick={() => setMediaModal({ isOpen: true, url: msg.content, type: 'IMAGE' })} />;
      case 'VIDEO':
        return (
          <div className="relative cursor-pointer group" onClick={() => setMediaModal({ isOpen: true, url: msg.content, type: 'VIDEO' })}>
            <video src={msg.content} className="max-w-[200px] rounded-lg pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center pl-1 backdrop-blur-sm">
                <FiPlay className="text-white text-2xl" />
              </div>
            </div>
          </div>
        );
      case 'AUDIO': return <audio src={msg.content} controls className="max-w-[200px] h-10" />;
      case 'DOCUMENT':
        return (
          <button type="button" onClick={() => setMediaModal({ isOpen: true, url: msg.content, type: 'DOCUMENT' })} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg hover:bg-black/40 transition text-white w-full text-left">
            <div className="w-10 h-10 bg-[#ccff00] text-black rounded-full flex items-center justify-center shrink-0"><FiDownload /></div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm truncate">Document</span>
              <span className="text-xs opacity-70">Click to view</span>
            </div>
          </button>
        );
      default: {
        if (!msg.content) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = msg.content.split(urlRegex);
        return (
          <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.match(urlRegex)) {
                const handleLinkClick = (e) => {
                  const lowerPart = part.toLowerCase();
                  if (lowerPart.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
                    e.preventDefault();
                    setMediaModal({ isOpen: true, url: part, type: 'IMAGE' });
                  } else if (lowerPart.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
                    e.preventDefault();
                    setMediaModal({ isOpen: true, url: part, type: 'VIDEO' });
                  } else if (lowerPart.match(/\.(pdf|doc|docx|xls|xlsx)(\?.*)?$/i)) {
                    e.preventDefault();
                    setMediaModal({ isOpen: true, url: part, type: 'DOCUMENT' });
                  }
                };

                return (
                  <a 
                    key={index} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleLinkClick}
                    className="text-blue-500 hover:text-blue-400 underline break-all"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </p>
        );
      }
    }
  };

  const formatTime = (time) => {
    const timestamp = time || null;
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const getDateLabel = (dateStr) => {
    const timestamp = dateStr || null;
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const d = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    return `Last seen ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="h-screen w-screen flex bg-[#0c0c0c] text-white overflow-hidden selection:bg-[#ccff00] selection:text-black animate-in fade-in duration-500 font-['Outfit']">
      
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />

      <div className="flex-1 w-full flex relative z-10">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[320px] lg:w-[380px] border-r border-white/10 flex flex-col shrink-0 bg-[#0c0c0c]">
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                <HiArrowLeft className="text-xl" />
              </button>
              <h2 className="text-2xl font-bold text-white">Messages</h2>
            </div>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search active chats..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#ccff00]/50 transition-colors placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredUsers.map(user => (
              <button 
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 border-b border-white/5 transition-all text-left ${selectedUser?.id === user.id ? 'bg-white/5 border-l-4 border-l-[#ccff00]' : 'border-l-4 border-l-transparent'}`}
              >
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
                    <FiUser className="text-[#ccff00] text-xl" />
                  </div>
                  {onlineUsers[String(user.id)]?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#0c0c0c] block" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-white truncate text-[15px]">{user.fullName}</h3>
                    {onlineUsers[String(user.id)]?.isOnline ? (
                      <span className="text-[10px] font-bold text-green-400 shrink-0 tracking-wider">Online</span>
                    ) : onlineUsers[String(user.id)]?.lastSeen ? (
                      <span className="text-[10px] text-gray-500 shrink-0">{formatLastSeen(onlineUsers[String(user.id)].lastSeen).replace('Last seen ', '')}</span>
                    ) : user.lastMessage ? (
                      <span className="text-[10px] text-gray-500 shrink-0">{formatTime(user.lastMessage.createdAt || user.lastMessage.created_at)}</span>
                    ) : null}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      {user.lastMessage && (
                        <p className={`text-[11px] truncate font-medium mt-0.5 ${user.unreadCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                          {user.lastMessage.type === 'TEXT' ? user.lastMessage.content : `[${user.lastMessage.type}]`}
                        </p>
                      )}
                    </div>
                    {user.unreadCount > 0 && (
                      <div className="min-w-[22px] h-[22px] bg-[#ccff00] rounded-full flex items-center justify-center px-1.5 shadow-[0_0_12px_rgba(204,255,0,0.4)]">
                        <span className="text-[11px] text-black font-bold">{user.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No active chats found.</div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 flex flex-col bg-[#111] relative">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0c0c0c]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20 relative shrink-0">
                    <FiUser className="text-[#ccff00] text-lg" />
                    {onlineUsers[String(selectedUser.id)]?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0c0c0c] block" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-white leading-tight">{selectedUser.fullName}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      {onlineUsers[String(selectedUser.id)]?.isOnline ? (
                        <span className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Online
                        </span>
                      ) : onlineUsers[String(selectedUser.id)]?.lastSeen ? (
                        <span className="text-xs text-gray-400">{formatLastSeen(onlineUsers[String(selectedUser.id)].lastSeen)}</span>
                      ) : null}
                      {selectedUser.email && (
                        <span className="text-xs text-gray-500 font-medium border-l border-white/10 pl-3">
                          {selectedUser.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(() => {
                  let lastDateLabel = null;
                  return messages.map((msg, index) => {
                    const isAdmin = msg.senderType === 'admin';
                    const msgKey = msg.id || msg.tempId || index;
                    const dateLabel = getDateLabel(msg.createdAt || msg.created_at);
                    const showDateSep = dateLabel && dateLabel !== lastDateLabel;
                    if (showDateSep) lastDateLabel = dateLabel;

                    return (
                      <React.Fragment key={msgKey}>
                        {/* Date Separator */}
                        {showDateSep && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[11px] font-semibold text-gray-500 px-3 py-1 rounded-full bg-white/5 border border-white/10 whitespace-nowrap tracking-wide">
                              {dateLabel}
                            </span>
                            <div className="flex-1 h-px bg-white/10" />
                          </div>
                        )}

                        <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${isAdmin ? 'self-end flex-row-reverse' : 'self-start'}`}>
                          {!isAdmin && (
                            <div className="w-8 h-8 rounded-full bg-[#ccff00]/20 border border-[#ccff00]/30 shrink-0 flex items-center justify-center mt-1 shadow-sm">
                              <FiUser className="text-[#ccff00] text-[14px]" />
                            </div>
                          )}

                          {/* Message Bubble + three-dot menu */}
                          <div className={`flex items-center gap-1.5 group ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button
                              onClick={() => setActiveMenu(msg)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                              title="Message options"
                            >
                              <BsThreeDotsVertical className="text-[13px]" />
                            </button>

                            <div className="flex flex-col gap-1">
                              <div className={`${(msg.type === 'IMAGE' || msg.type === 'VIDEO') ? 'p-1' : 'px-5 py-3'} rounded-2xl shadow-sm ${isAdmin ? 'bg-[#ccff00] text-black rounded-br-sm' : 'bg-[#202020] text-white border border-white/5 rounded-bl-sm'}`}>
                                {renderMessageContent(msg, isAdmin)}
                              </div>
                              <span className={`text-[10px] text-gray-500 font-medium flex items-center gap-1 ${isAdmin ? 'justify-end pr-1' : 'pl-1'}`}>
                                {formatTime(msg.created_at || msg.createdAt)} 
                                {isAdmin && (
                                  <TbChecks className={`text-lg ${msg.isRead ? 'text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]' : 'text-white/30'}`} title={msg.isRead ? 'Seen' : 'Delivered'} />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-white/5 bg-[#0c0c0c] relative">
                {isRecording && (
                  <div className="absolute top-0 left-0 w-full h-full bg-[#ccff00]/10 flex items-center justify-center gap-4 z-20 backdrop-blur-sm">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-white font-bold tracking-widest uppercase text-sm animate-pulse">Recording Voice Note...</span>
                    <button onClick={stopRecording} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center ml-4 shadow-xl hover:bg-red-500 hover:text-white transition-colors">
                      <FiSquare />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendText} className="flex items-center gap-4 max-w-4xl mx-auto">
                  
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  
                  <button type="button" onClick={() => setIsLinkModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#111] hover:bg-[#ccff00]/10 text-gray-400 hover:text-[#ccff00] border border-white/5 transition-colors shrink-0" title="Share a link">
                    <FiLink2 className="text-xl" />
                  </button>

                  <button type="button" onClick={handleFileSelect} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#111] hover:bg-[#ccff00]/10 text-gray-400 hover:text-[#ccff00] border border-white/5 transition-colors shrink-0" title="Attach file">
                    <FiPaperclip className="text-xl" />
                  </button>

                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Message ${selectedUser.fullName}...`} 
                      className="w-full bg-[#111] border border-white/5 rounded-full px-6 py-3.5 text-sm text-white focus:outline-none focus:border-[#ccff00]/50 placeholder-gray-600"
                      disabled={isRecording}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={message.trim() ? handleSendText : startRecording}
                    className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all ${message.trim() ? 'bg-[#ccff00] text-black hover:bg-white' : 'bg-[#111] text-gray-400 hover:text-red-500 border border-white/5 hover:border-red-500'}`}
                  >
                    {message.trim() ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" /></svg>
                    ) : (
                      <FiMic className="text-xl" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-[#111] border border-white/5 flex items-center justify-center mb-6">
                <MdSupportAgent className="text-5xl text-gray-700" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Med Health Invest Support</h3>
              <p className="text-gray-500 max-w-sm">Select a user from the left sidebar to start messaging, share files, or send voice notes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Link Sharing Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-center text-black mb-2">Share a link</h3>
            <p className="text-center text-gray-500 text-sm mb-6">Enter the URL</p>
            
            <input 
              type="url" 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-black mb-6 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendLink();
              }}
            />
            
            <div className="flex justify-center gap-3">
              <button 
                onClick={handleSendLink}
                className="bg-black text-white px-6 py-2 rounded-md font-bold hover:bg-gray-800 transition-colors"
              >
                OK
              </button>
              <button 
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkUrl('');
                }}
                className="bg-[#6b7280] text-white px-6 py-2 rounded-md font-bold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Modal */}
      {mediaModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setMediaModal({ isOpen: false, url: '', type: '' })}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setMediaModal({ isOpen: false, url: '', type: '' }); }}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-red-500 rounded-full text-white flex items-center justify-center text-2xl z-[410] transition-colors"
            title="Close"
          >
            <FiX />
          </button>
          <div 
            className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaModal.type === 'IMAGE' && (
              <img 
                src={mediaModal.url} 
                alt="Media" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); setMediaModal({ isOpen: false, url: '', type: '' }); }} 
              />
            )}
            {mediaModal.type === 'VIDEO' && (
              <video src={mediaModal.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl" />
            )}
            {mediaModal.type === 'DOCUMENT' && (
              <iframe src={mediaModal.url} className="w-full h-full bg-white rounded-xl shadow-2xl" title="Document Viewer" />
            )}
          </div>
        </div>
      )}

      {/* Message Options Modal */}
      {activeMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setActiveMenu(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">Message Options</h3>
              <button
                onClick={() => setActiveMenu(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            {/* Modal Actions */}
            <div className="py-2">
              {/* Copy text — only for TEXT */}
              {(!activeMenu.type || activeMenu.type === 'TEXT') && (
                <button
                  onClick={() => handleCopyText(activeMenu.content)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <FiCopy className="text-gray-500 text-base" />
                  </span>
                  <span className="font-medium text-[15px]">Copy text</span>
                </button>
              )}
              {/* Download — for media types */}
              {(activeMenu.type === 'IMAGE' || activeMenu.type === 'VIDEO' || activeMenu.type === 'DOCUMENT') && (
                <button
                  onClick={(e) => handleDownloadMedia(activeMenu.content, e)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <FiDownload className="text-gray-500 text-base" />
                  </span>
                  <span className="font-medium text-[15px]">Download media</span>
                </button>
              )}
              {/* Delete for everyone - only for sender */}
              {activeMenu.senderType === 'admin' && (
                <button
                  onClick={() => handleDeleteMessage(activeMenu)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-red-50 transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <FiTrash2 className="text-red-500 text-base" />
                  </span>
                  <span className="font-semibold text-[15px] text-red-500">Delete for Everyone</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
