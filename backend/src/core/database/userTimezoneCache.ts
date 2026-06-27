import { BoundedMap } from '../utils/boundedCache';

/** TZ por userId en RAM — evita SELECT en record_user_request sin import circular con statsService. */
const tzByUserId = new BoundedMap<string, string>(1000);

export function setUserTimezone(userId: string, timezone: string | undefined): void {
    if (userId && timezone) {
        tzByUserId.set(userId, timezone);
    }
}

export function getUserTimezone(userId: string): string {
    return tzByUserId.get(userId) ?? 'UTC';
}

export function clearUserTimezone(userId: string): void {
    tzByUserId.delete(userId);
}
