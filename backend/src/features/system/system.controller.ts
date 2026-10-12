/**
 * Compat para imports legacy de system.
 * Preferir imports directos desde systemValidate/systemKey/systemFeedback/systemHealth/systemRealtime.
 */
export * from '../auth/validate.controller';
export * from '../auth/apiKey.controller';
export * from './systemFeedback.controller';
export * from './systemHealth.controller';
export * from '../auth/realtimeToken.controller';
export * from './systemPublicUsers.controller';
