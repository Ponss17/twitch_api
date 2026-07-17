/** @type {import('ts-jest').JestConfigWithTsJest} */
const backendTransform = {
    '^.+\\.tsx?$': [
        'ts-jest',
        {
            tsconfig: 'tsconfig.test.json'
        }
    ]
};

const frontendTransform = {
    '^.+\\.tsx?$': [
        'ts-jest',
        {
            tsconfig: 'tsconfig.test.frontend.json'
        }
    ]
};

module.exports = {
    forceExit: true,
    detectOpenHandles: true,
    projects: [
        {
            displayName: 'backend',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/**/*.test.ts'],
            testPathIgnorePatterns: ['<rootDir>/tests/unit/frontend/', '<rootDir>/e2e/'],
            transform: backendTransform,
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/backend/src/$1',
                '^@/core/database/redisClient$': '<rootDir>/backend/src/core/database/__mocks__/redisClient.ts'
            },
            setupFiles: ['<rootDir>/tests/setup.ts'],
            modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/api/_bundle/'],
            verbose: true
        },
        {
            displayName: 'frontend',
            preset: 'ts-jest',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/tests/unit/frontend/**/*.test.ts', '<rootDir>/tests/unit/frontend/**/*.test.tsx'],
            transform: frontendTransform,
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
                '^@contracts/(.*)$': '<rootDir>/backend/src/core/schemas/$1'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts'],
            modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/api/_bundle/'],
            verbose: true
        }
    ]
};
