// Unmapped properties will pass through directly
const standardMapping = {
  blockNumber: parseInt,
  timestamp: (p) => {
    // Convert to seconds if its provided in ms
    if (p.length >= 13) {
      return parseInt(p) / 1000;
    }
    return parseInt(p);
  }
}

class RestParsingUtil {

  static parseQuery(query, parseMapping = standardMapping) {
    const retval = {};
    for (const property in query) {
      retval[property] = parseMapping[property]?.call(null, query[property]) ?? query[property];
    }
    return retval;
  }
}

module.exports = RestParsingUtil;
