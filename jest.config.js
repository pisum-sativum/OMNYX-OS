/**
 * Two test projects:
 *  - "logic": pure TypeScript modules (services, utils) with no React Native
 *    runtime deps. Uses ts-jest in a node environment — fast and lightweight.
 *  - "components": React component tests (*.test.tsx) that need the React
 *    Native / Expo transform + mocks. Uses the jest-expo preset and
 *    @testing-library/react-native.
 */
const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  '^@screens/(.*)$': '<rootDir>/src/screens/$1',
  '^@services/(.*)$': '<rootDir>/src/services/$1',
  '^@agents/(.*)$': '<rootDir>/src/agents/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  '^@styles/(.*)$': '<rootDir>/src/styles/$1',
  '^@store/(.*)$': '<rootDir>/src/store/$1',
  '^@types/(.*)$': '<rootDir>/src/types/$1',
  '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  '^@data/(.*)$': '<rootDir>/src/data/$1',
};

module.exports = {
  projects: [
    {
      displayName: 'logic',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleNameMapper,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json', isolatedModules: true }],
      },
    },
    {
      displayName: 'components',
      preset: 'jest-expo',
      testMatch: ['**/__tests__/**/*.test.tsx'],
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.components.js'],
    },
  ],
};
