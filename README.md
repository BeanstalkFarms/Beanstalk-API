# Beanstalk API

REST API for getting information as to the current and historical state of Beanstalk and related protocols.

Currently this project is used for integrating with CoinGecko and DefiLlama at the below endpoints:
- `/basin/tickers`
- `/silo/yield`

## Getting Started

You will need to have Docker installed on your system to start the application, as this is required for the database. You may also need to give execute permission to the docker helper scripts (`chmod +x ./docker/*.sh`).

To run everything inside of Docker:

1. Run `cp .env.example ./docker/.env`, and supply the appropriate values in the created `.env` file.
2. Run `npm run docker`. This will start both the API and postgres database
3. Stop with `npm run docker:stop`.

To run the databse inside Docker and the API on the host machine (faster for testing locally as it doesn't build an image)

1. Run `npm install`
2. Run `cp .env.example .env`, and supply the appropriate values in the created `.env` file.
3. Start the postgres container with `npm run docker:postgres`.
4. To run the application, `npm start`
5. The database can be stopped with `npm run docker:stop`.
