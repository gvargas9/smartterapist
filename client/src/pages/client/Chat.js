import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { voiceService } from '../../services/voiceService';
import { useTranslation } from 'react-i18next';
import VoiceSettings from '../../components/VoiceSettings';
import { PaperAirplaneIcon, MicrophoneIcon, XCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Initialize or load existing conversation
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        // Check if there's a stored conversation ID
        const storedConversationId = localStorage.getItem('currentConversationId');
        
        if (storedConversationId) {
          setCurrentConversationId(storedConversationId);
          
          // Load messages for this conversation
          const messages = await chatService.getConversationHistory(storedConversationId);
          setMessages(messages);
        } else {
          // Create a new conversation
          const newConversationId = await chatService.createConversation(user.id);
          setCurrentConversationId(newConversationId);
          localStorage.setItem('currentConversationId', newConversationId);
          
          // Add a welcome message
          const welcomeMessage = {
            id: `welcome-${Date.now()}`,
            conversation_id: newConversationId,
            sender: 'ai',
            text: t('chat.welcomeMessage', { name: user.profile_data?.name || t('chat.there') }),
            timestamp: new Date().toISOString(),
            sentiment_score: 0.8
          };
          
          await chatService.saveMessage(welcomeMessage);
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        // Show error in UI
        setMessages([{
          id: `error-${Date.now()}`,
          sender: 'system',
          text: t('chat.errorStartingConversation'),
          timestamp: new Date().toISOString(),
        }]);
      }
    };
    
    if (user) {
      initializeConversation();
    }
    
    // Cleanup function to end conversation when component unmounts
    return () => {
      if (currentConversationId) {
        chatService.endConversation(currentConversationId).catch(err => 
          console.error('Error ending conversation:', err)
        );
      }
    };
  }, [user]);
  
  // Focus on input when messages change
  useEffect(() => {
    if (!isRecording && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isRecording]);
  
  // Handle text message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentConversationId) return;
    
    const userMessage = {
      conversation_id: currentConversationId,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      // Save message to database
      await chatService.saveMessage(userMessage);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Get AI response
      const aiResponse = await chatService.getAIResponse(userMessage.text, currentConversationId, user.id);
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Create AI message
      const aiMessage = {
        conversation_id: currentConversationId,
        sender: 'ai',
        text: aiResponse.message,
        timestamp: new Date().toISOString(),
        sentiment_score: aiResponse.sentiment_score
      };
      
      // Save AI response to database
      await chatService.saveMessage(aiMessage);
      
      // Update UI
      setMessages(prev => [...prev, aiMessage]);
      
      // If this is the 5th message in the conversation, generate a summary
      if (messages.length >= 4) {
        chatService.generateSummary(currentConversationId).catch(err => 
          console.error('Error generating summary:', err)
        );
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      
      // Show error in UI
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'system',
        text: t('chat.errorProcessingMessage'),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // State for voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    preferredVoice: 'en-US-Neural2-F',
    speed: 1.0,
    pitch: 1.0
  });
  
  // State for TTS playback
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  
  // State for voice settings modal
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Toggle text-to-speech
  const toggleVoiceEnabled = async () => {
    const newSettings = { ...voiceSettings, enabled: !voiceSettings.enabled };
    setVoiceSettings(newSettings);
    
    if (user?.id) {
      await voiceService.updateUserVoiceSettings(user.id, newSettings);
    }
  };
  
  // Open voice settings modal
  const openVoiceSettings = () => {
    setShowVoiceSettings(true);
  };
  
  // Handle voice settings save
  const handleSaveVoiceSettings = (newSettings) => {
    setVoiceSettings(newSettings);
  };
  
  // Play message using TTS
  const playMessage = async (message) => {
    if (!voiceSettings.enabled || isSpeaking) return;
    
    try {
      setIsSpeaking(true);
      
      // Get current language for TTS
      const language = i18n.language || 'en';
      const ttsVoice = language === 'en' ? 'en-US-Neural2-F' : language === 'es' ? 'es-ES-Neural2-F' : voiceSettings.preferredVoice;
      
      // Convert text to speech
      const audioBlob = await voiceService.textToSpeech(message.text, {
        voice: ttsVoice,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch
      });
      
      // Play the audio
      await voiceService.playAudio(audioBlob);
    } catch (error) {
      console.error('Error playing TTS:', error);
    } finally {
      setIsSpeaking(false);
    }
  };
  
  // Play AI responses automatically if TTS is enabled
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai' && voiceSettings.enabled && !isSpeaking) {
      playMessage(lastMessage);
    }
  }, [messages]);
  
  // Get translation function
  const { t, i18n } = useTranslation();
  
  // Load user voice settings
  useEffect(() => {
    const loadVoiceSettings = async () => {
      if (user?.id) {
        try {
          const settings = await voiceService.getUserVoiceSettings(user.id);
          setVoiceSettings(settings);
        } catch (error) {
          console.error('Error loading voice settings:', error);
        }
      }
    };
    
    loadVoiceSettings();
  }, [user]);
  
  // Handle voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      
      setIsRecording(false);
    } else {
      try {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        
        const chunks = [];
        setRecordedChunks(chunks);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          try {
            setIsProcessing(true);
            
            // Create audio blob from recorded chunks
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            
            // Get current language for STT
            const language = i18n.language || 'en';
            const sttLanguage = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'en-US';
            
            // Convert speech to text using ultravox.ai
            const transcribedText = await voiceService.speechToText(audioBlob, sttLanguage);
            
            if (transcribedText) {
              setInputMessage(transcribedText);
            }
          } catch (error) {
            console.error('Error processing speech to text:', error);
            setMessages(prev => [...prev, {
              id: `error-${Date.now()}`,
              sender: 'system',
              text: t('chat.speechToTextError'),
              timestamp: new Date().toISOString(),
            }]);
          } finally {
            setIsProcessing(false);
          }
        };
        
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        // Show error in UI
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          sender: 'system',
          text: t('chat.microphoneError'),
          timestamp: new Date().toISOString(),
        }]);
      }
    }
  };
  
  // Start a new conversation
  const startNewConversation = async () => {
    try {
      // End current conversation if exists
      if (currentConversationId) {
        await chatService.endConversation(currentConversationId);
      }
      
      // Create a new conversation
      const newConversationId = await chatService.createConversation(user.id);
      setCurrentConversationId(newConversationId);
      localStorage.setItem('currentConversationId', newConversationId);
      
      // Add a welcome message
      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        conversation_id: newConversationId,
        sender: 'ai',
        text: t('chat.welcomeMessage', { name: user.profile_data?.name || t('chat.there') }),
        timestamp: new Date().toISOString(),
        sentiment_score: 0.8
      };
      
      await chatService.saveMessage(welcomeMessage);
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error starting new conversation:', error);
      // Show error in UI
      setMessages([{
        id: `error-${Date.now()}`,
        sender: 'system',
        text: t('chat.errorStartingNewConversation'),
        timestamp: new Date().toISOString(),
      }]);
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-secondary-900">{t('chat.aiTherapySession')}</h2>
        <button
          onClick={startNewConversation}
          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
        >
          {t('chat.newConversation')}
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender !== 'user' && message.sender !== 'system' && (
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
                {t('chat.ai')}
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-primary-500 text-white'
                  : message.sender === 'system'
                  ? 'bg-red-100 text-red-900'
                  : 'bg-white text-secondary-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <span className={`text-xs ${message.sender === 'user' ? 'text-primary-100' : 'text-secondary-500'} mt-1 block`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {message.sender === 'user' && (
              <div className="h-8 w-8 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600 ml-2">
                {user.profile_data?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white mr-2">
              {t('chat.ai')}
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isProcessing || isRecording}
            placeholder={isRecording ? t('chat.recording') : t('chat.typeYourMessage')}
            className="flex-1 rounded-lg border border-secondary-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {isRecording ? (
            <button
              type="button"
              onClick={toggleRecording}
              className="p-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title={t('chat.stopRecording')}
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isProcessing}
              className="p-3 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 transition-colors disabled:opacity-50"
              title={t('chat.startRecording')}
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>
          )}
          
          {/* TTS toggle button */}
          <button
            type="button"
            onClick={toggleVoiceEnabled}
            className={`p-3 rounded-lg transition-colors ${voiceSettings.enabled ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={voiceSettings.enabled ? t('chat.disableVoice') : t('chat.enableVoice')}
          >
            {voiceSettings.enabled ? (
              <SpeakerWaveIcon className="h-6 w-6" />
            ) : (
              <SpeakerXMarkIcon className="h-6 w-6" />
            )}
          </button>
          
          {/* Voice settings button */}
          <button
            type="button"
            onClick={openVoiceSettings}
            className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title={t('chat.voiceSettings')}
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing || isRecording}
            className="p-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
      
      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <VoiceSettings
          initialSettings={voiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          onSave={handleSaveVoiceSettings}
        />
      )}
    </div>
  );
};

export default Chat;
