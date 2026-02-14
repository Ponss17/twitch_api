/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
                isolatedModules: true
            }
        ]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@vercel/kv$': '<rootDir>/tests/__mocks__/@vercel/kv.ts'
    },
    setupFiles: ['<rootDir>/tests/setup.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    verbose: true
};
