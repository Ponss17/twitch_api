export const safeString = (val: unknown): string => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
    return '';
};
