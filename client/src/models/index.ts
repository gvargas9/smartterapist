/**
 * Models Index
 * 
 * Exports all Supabase models for easy importing.
 */

const { UserModel } = require('./UserModel');
const { ClientModel } = require('./ClientModel');
const { TherapistModel } = require('./TherapistModel');
const { TherapySessionModel } = require('./TherapySessionModel');
const { MessageModel } = require('./MessageModel');
const { BehaviorRecordModel } = require('./BehaviorRecordModel');

module.exports = {
  UserModel,
  ClientModel,
  TherapistModel,
  TherapySessionModel,
  MessageModel,
  BehaviorRecordModel
};
