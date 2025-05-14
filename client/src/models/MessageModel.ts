/**
 * Message Model
 * 
 * Provides methods for interacting with the messages table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { Message, InsertTables, UpdateTables } from '../types/supabase';

export class MessageModel {
  /**
   * Get a message by ID
   * @param id - Message ID
   * @returns The message or null if not found
   */
  static async getById(id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching message:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get messages sent by a user
   * @param userId - User ID
   * @returns Array of messages sent by the user
   */
  static async getSentByUser(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sent messages:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get messages received by a user
   * @param userId - User ID
   * @returns Array of messages received by the user
   */
  static async getReceivedByUser(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching received messages:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get conversation between two users
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Array of messages between the two users
   */
  static async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get messages with sender and recipient data
   * @param filters - Optional filters to apply
   * @returns Array of messages with related user data
   */
  static async getWithUserData(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (id, first_name, last_name, email),
        recipient:recipient_id (id, first_name, last_name, email)
      `);
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching messages with user data:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new message
   * @param message - Message data to insert
   * @returns The created message or null if there was an error
   */
  static async create(message: InsertTables<'messages'>): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a message
   * @param id - Message ID
   * @param updates - Message data to update
   * @returns The updated message or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'messages'>): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating message:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a message
   * @param id - Message ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Mark a message as read
   * @param id - Message ID
   * @returns The updated message or null if there was an error
   */
  static async markAsRead(id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking message as read:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Mark all messages as read for a recipient
   * @param recipientId - Recipient user ID
   * @returns Number of messages marked as read
   */
  static async markAllAsRead(recipientId: string): Promise<number> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', recipientId)
      .eq('read', false)
      .select();
    
    if (error) {
      console.error('Error marking all messages as read:', error);
      return 0;
    }
    
    return data?.length || 0;
  }

  /**
   * Count unread messages for a user
   * @param userId - User ID
   * @returns Count of unread messages
   */
  static async countUnread(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    
    if (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
    
    return count || 0;
  }

  /**
   * Subscribe to new messages for a user
   * @param userId - User ID
   * @param callback - Callback function to handle new messages
   * @returns Subscription object with unsubscribe method
   */
  static subscribeToNewMessages(userId: string, callback: (payload: any) => void): { unsubscribe: () => void } {
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
    
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }
}
