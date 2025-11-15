module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tests/tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^react$': '<rootDir>/frontend/node_modules/react',
    '^react-dom$': '<rootDir>/frontend/node_modules/react-dom',
    '^swiper/react$': '<rootDir>/tests/__mocks__/swiper-react.tsx',
    '^swiper/css$': '<rootDir>/tests/__mocks__/css-mock.js',
  },
  moduleDirectories: ['<rootDir>/frontend/node_modules', 'node_modules'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};