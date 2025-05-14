import { supabase } from './supabaseClient';

/**
 * Service for handling chat-related functionality
 */
export const chatService = {
  /**
   * Get conversation history for a specific conversation
   * @param {string} conversationId - The ID of the conversation
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversationHistory(conversationId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  },
  
  /**
   * Create a new conversation
   * @param {string} clientId - The client's user ID
   * @param {string|null} therapistId - The therapist's user ID (null for AI-only)
   * @returns {Promise<string>} - The new conversation ID
   */
  async createConversation(clientId, therapistId = null) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            client_id: clientId,
            therapist_id: therapistId,
            start_ts: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },
  
  /**
   * End a conversation
   * @param {string} conversationId - The ID of the conversation to end
   * @returns {Promise<void>}
   */
  async endConversation(conversationId) {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ end_ts: new Date().toISOString() })
        .eq('id', conversationId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  },
  
  /**
   * Save a message to the database
   * @param {Object} message - The message object
   * @returns {Promise<Object>} - The saved message
   */
  async saveMessage(message) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },
  
  /**
   * Get AI response for a message
   * @param {string} message - The user's message
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - The AI response
   */
  async getAIResponse(message, conversationId, userId) {
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate a response with a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          // Get the current behavior for the user
          this.getCurrentBehavior(userId).then(behavior => {
            let responseText = 'I understand how you feel. Can you tell me more about that?';
            
            // Simple keyword-based responses for demo purposes
            if (message.toLowerCase().includes('anxious') || message.toLowerCase().includes('anxiety')) {
              responseText = `I notice you mentioned feeling anxious. ${behavior?.name === 'CBT-focused' ? 
                'Let\'s identify what thoughts might be contributing to this anxiety. Can you share what\'s going through your mind?' : 
                'Taking slow, deep breaths can help in the moment. Would you like to try a brief breathing exercise together?'}`;
            } else if (message.toLowerCase().includes('sad') || message.toLowerCase().includes('depressed')) {
              responseText = `I'm sorry to hear you're feeling down. ${behavior?.name === 'Motivational' ? 
                "What's one small thing you could do today that might bring you a moment of joy?" : 
                "Depression can make everything feel more difficult. Have you noticed any patterns to when these feelings are strongest?"}`;
            } else if (message.toLowerCase().includes('work') || message.toLowerCase().includes('job')) {
              responseText = `Work situations can be challenging. ${behavior?.name === 'Mindfulness' ? 
                "When you're at work, what helps you stay grounded in the present moment?" : 
                "How do you think your thoughts about work are affecting your emotions and behaviors?"}`;
            }
            
            resolve({
              message: responseText,
              sentiment_score: Math.random() * 0.5 + 0.5 // Random positive sentiment between 0.5-1.0
            });
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  },
  
  /**
   * Get the current active behavior for a user
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} - The active behavior or null
   */
  async getCurrentBehavior(userId) {
    try {
      const { data, error } = await supabase
        .from('client_behaviors')
        .select('behaviors(*)')
        .eq('client_id', userId)
        .eq('active', true)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.behaviors || null;
    } catch (error) {
      console.error('Error getting current behavior:', error);
      return null;
    }
  },
  
  /**
   * Generate a summary for a conversation
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} - The generated summary
   */
  async generateSummary(conversationId) {
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll create a mock summary
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      // Calculate simple sentiment metrics
      const sentimentScores = messages
        .filter(m => m.sentiment_score !== null)
        .map(m => m.sentiment_score);
        
      const sentimentMetrics = {
        average: sentimentScores.length > 0 
          ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
          : 0.5,
        min: sentimentScores.length > 0 
          ? Math.min(...sentimentScores) 
          : 0.5,
        max: sentimentScores.length > 0 
          ? Math.max(...sentimentScores) 
          : 0.5,
        trend: sentimentScores.length > 1 && sentimentScores[sentimentScores.length - 1] > sentimentScores[0]
          ? 'improving'
          : sentimentScores.length > 1 && sentimentScores[sentimentScores.length - 1] < sentimentScores[0]
          ? 'declining'
          : 'stable'
      };
      
      // Create a simple summary based on message content
      let summaryText = 'Session focused on ';
      
      if (messages.some(m => m.text.toLowerCase().includes('anxiety') || m.text.toLowerCase().includes('anxious'))) {
        summaryText += 'anxiety management. ';
      } else if (messages.some(m => m.text.toLowerCase().includes('work') || m.text.toLowerCase().includes('job'))) {
        summaryText += 'work-related stress. ';
      } else if (messages.some(m => m.text.toLowerCase().includes('sad') || m.text.toLowerCase().includes('depressed'))) {
        summaryText += 'mood improvement strategies. ';
      } else {
        summaryText += 'general well-being. ';
      }
      
      summaryText += `Overall sentiment was ${sentimentMetrics.trend}. `;
      
      if (sentimentMetrics.trend === 'improving') {
        summaryText += 'Client showed progress during the session.';
      } else if (sentimentMetrics.trend === 'declining') {
        summaryText += 'Client may need additional support in future sessions.';
      } else {
        summaryText += 'Client maintained consistent engagement throughout the session.';
      }
      
      // Save the summary to the database
      const { data: summary, error: summaryError } = await supabase
        .from('summaries')
        .insert([
          {
            conversation_id: conversationId,
            summary_text: summaryText,
            sentiment_metrics: sentimentMetrics
          }
        ])
        .select()
        .single();
        
      if (summaryError) throw summaryError;
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }
};
