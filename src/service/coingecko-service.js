const { basinSG, gql } = require("../datasources/subgraph-client");

async function getTickers() {
  const wells = await basinSG(gql`
    {
      wells {
        id
        tokens {
          id
          decimals
        }
        reserves
      }
    }`);

  console.log(wells);
}

module.exports = {
  getTickers
}
