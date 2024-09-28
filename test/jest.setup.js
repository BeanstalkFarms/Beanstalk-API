// Disables all database interactions
jest.mock('../src/repository/postgres/models/index', () => ({}));
// Disables any discord messaging
jest.mock('../src/utils/discord', () => ({}));
