export function isValidIanaTimezone(value: string): boolean {
    if (!value || value.length > 100) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
        return true;
    } catch {
        return false;
    }
}
