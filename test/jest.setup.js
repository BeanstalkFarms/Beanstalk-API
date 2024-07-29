// Disables all database interactions
jest.mock('../src/repository/postgres/models/index', () => ({}));
