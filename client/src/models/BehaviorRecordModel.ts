/**
 * BehaviorRecord Model
 * 
 * Provides methods for interacting with the behavior_records table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { BehaviorRecord, InsertTables, UpdateTables } from '../types/supabase';

export class BehaviorRecordModel {
  /**
   * Get a behavior record by ID
   * @param id - Behavior record ID
   * @returns The behavior record or null if not found
   */
  static async getById(id: string): Promise<BehaviorRecord | null> {
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching behavior record:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get behavior records by client ID
   * @param clientId - Client ID
   * @returns Array of behavior records for the client
   */
  static async getByClientId(clientId: string): Promise<BehaviorRecord[]> {
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching behavior records by client ID:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get behavior records by behavior type
   * @param clientId - Client ID
   * @param behaviorType - Behavior type
   * @returns Array of behavior records of the specified type
   */
  static async getByBehaviorType(clientId: string, behaviorType: string): Promise<BehaviorRecord[]> {
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .eq('client_id', clientId)
      .eq('behavior_type', behaviorType)
      .order('recorded_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching behavior records by type:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get behavior records within a date range
   * @param clientId - Client ID
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Array of behavior records within the date range
   */
  static async getByDateRange(clientId: string, startDate: string, endDate: string): Promise<BehaviorRecord[]> {
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .eq('client_id', clientId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching behavior records by date range:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get behavior records with client data
   * @param filters - Optional filters to apply
   * @returns Array of behavior records with client data
   */
  static async getWithClientData(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase
      .from('behavior_records')
      .select(`
        *,
        clients!behavior_records_client_id_fkey (
          *,
          users:user_id (*)
        )
      `);
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching behavior records with client data:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new behavior record
   * @param record - Behavior record data to insert
   * @returns The created behavior record or null if there was an error
   */
  static async create(record: InsertTables<'behavior_records'>): Promise<BehaviorRecord | null> {
    const { data, error } = await supabase
      .from('behavior_records')
      .insert(record)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating behavior record:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a behavior record
   * @param id - Behavior record ID
   * @param updates - Behavior record data to update
   * @returns The updated behavior record or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'behavior_records'>): Promise<BehaviorRecord | null> {
    const { data, error } = await supabase
      .from('behavior_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating behavior record:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a behavior record
   * @param id - Behavior record ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('behavior_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting behavior record:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Get behavior statistics for a client
   * @param clientId - Client ID
   * @param days - Number of days to include in statistics (default: 30)
   * @returns Statistics about the client's behavior records
   */
  static async getStatistics(clientId: string, days: number = 30): Promise<any> {
    // Calculate the start date (X days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    // Get all behavior records in the date range
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .eq('client_id', clientId)
      .gte('recorded_at', startDateStr)
      .order('recorded_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching behavior statistics:', error);
      return {
        totalRecords: 0,
        behaviorTypes: {},
        averageSeverity: 0,
        severityTrend: []
      };
    }
    
    const records = data || [];
    
    // Calculate statistics
    const behaviorTypes: Record<string, number> = {};
    let totalSeverity = 0;
    let severityCount = 0;
    
    // Group records by date for trend analysis
    const recordsByDate: Record<string, any[]> = {};
    
    records.forEach(record => {
      // Count behavior types
      behaviorTypes[record.behavior_type] = (behaviorTypes[record.behavior_type] || 0) + 1;
      
      // Sum severity for average calculation
      if (record.severity !== null) {
        totalSeverity += record.severity;
        severityCount++;
      }
      
      // Group by date for trend
      const dateStr = record.recorded_at.split('T')[0]; // Get just the date part
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = [];
      }
      recordsByDate[dateStr].push(record);
    });
    
    // Calculate severity trend (average severity per day)
    const severityTrend = Object.entries(recordsByDate).map(([date, dayRecords]) => {
      const dayTotalSeverity = dayRecords.reduce((sum, record) => {
        return sum + (record.severity || 0);
      }, 0);
      const dayAverageSeverity = dayRecords.length > 0 ? dayTotalSeverity / dayRecords.length : 0;
      
      return {
        date,
        averageSeverity: dayAverageSeverity,
        count: dayRecords.length
      };
    });
    
    return {
      totalRecords: records.length,
      behaviorTypes,
      averageSeverity: severityCount > 0 ? totalSeverity / severityCount : 0,
      severityTrend
    };
  }

  /**
   * List all behavior records with pagination
   * @param page - Page number (starting from 0)
   * @param limit - Number of items per page
   * @returns Array of behavior records
   */
  static async list(page: number = 0, limit: number = 10): Promise<BehaviorRecord[]> {
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
      .from('behavior_records')
      .select('*')
      .range(from, to)
      .order('recorded_at', { ascending: false });
    
    if (error) {
      console.error('Error listing behavior records:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Count total number of behavior records
   * @returns Total count of behavior records
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('behavior_records')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting behavior records:', error);
      return 0;
    }
    
    return count || 0;
  }
}
