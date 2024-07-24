# Beanstalk API

REST API for getting information as to the current and historical state of Beanstalk and related protocols.

The impetus of this project is for integrating with CoinGecko, however this will be expanded with more features.

## Getting Started

You will need to have Docker installed on your system to start the application, as this will contain the database.

1. Run `npm install`
2. Run `cp .env.example .env`, and supply the appropriate values in `.env` file.
3. To run the application, `npm start`

TODO: Update this readme with instructions on the different docker scripts.
For faster development, I recommend using the `npm run docker:postgres` command to start the postgres service in docker, and then running the main application outside of docker with `npm start`. This is faster as it does not require rebuilding the api image each time.