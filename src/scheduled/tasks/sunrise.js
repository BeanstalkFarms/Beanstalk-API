const { waitForSunrise } = require('../util/on-sunrise');

async function handleSunrise() {
  await waitForSunrise();
  console.log('sunrise was processed by the subgraphs');
}

module.exports = {
  handleSunrise
};
