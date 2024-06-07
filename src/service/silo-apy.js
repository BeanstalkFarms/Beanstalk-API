/**
 * @typedef {Object} CalcApysOptions
 * @property {string} beanstalk
 * @property {number} season
 * @property {number} lookback
 * @property {string[]} assets
 */

/**
 * @typedef {Object} TokenApy
 * @property {string} token
 * @property {number} beanApy
 * @property {number} stalkApy
 */

/**
 * @typedef {Object} CalcApysResult
 * @property {string} beanstalk
 * @property {number} season
 * @property {number} lookback
 * @property {TokenApy[]} apys
 */

/**
 * Calculates vAPYs.
 * @param {CalcApysOptions} options
 * @returns {Promise<CalcApysResult[]>}
 */
async function calcApys(options) {
  
}

module.exports = {
  calcApys
};
