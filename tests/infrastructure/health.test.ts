describe('Environment Health Check', () => {
    it('should have NODE_ENV set to test', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have basic arithmetic working', () => {
        expect(1 + 1).toBe(2);
    });
});
