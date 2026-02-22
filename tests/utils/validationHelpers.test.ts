import { safeString, sanitizeHtml } from '@/utils/validationHelpers';

describe('validationHelpers', () => {
    describe('safeString', () => {
        it('should return string as-is', () => {
            expect(safeString('hello')).toBe('hello');
        });

        it('should return empty string for undefined', () => {
            expect(safeString(undefined)).toBe('');
        });

        it('should return empty string for null', () => {
            expect(safeString(null)).toBe('');
        });

        it('should return empty string for numbers', () => {
            expect(safeString(42)).toBe('');
        });

        it('should return first element of string array', () => {
            expect(safeString(['first', 'second'])).toBe('first');
        });

        it('should return empty string for empty array', () => {
            expect(safeString([])).toBe('');
        });

        it('should return empty string for array of non-strings', () => {
            expect(safeString([123, 456])).toBe('');
        });
    });

    describe('sanitizeHtml', () => {
        it('should escape & character', () => {
            expect(sanitizeHtml('a&b')).toBe('a&amp;b');
        });

        it('should escape < and > characters', () => {
            expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            );
        });

        it('should escape double quotes', () => {
            expect(sanitizeHtml('say "hello"')).toBe('say &quot;hello&quot;');
        });

        it('should escape single quotes', () => {
            expect(sanitizeHtml("it's")).toBe('it&#x27;s');
        });

        it('should handle string with no special chars', () => {
            expect(sanitizeHtml('hello world')).toBe('hello world');
        });

        it('should handle all special chars together', () => {
            expect(sanitizeHtml('<div class="a" data-x=\'b\'>&</div>')).toBe(
                '&lt;div class=&quot;a&quot; data-x=&#x27;b&#x27;&gt;&amp;&lt;/div&gt;'
            );
        });
    });
});
