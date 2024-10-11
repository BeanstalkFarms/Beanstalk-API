// Unmapped properties will pass through directly
const standardMapping = {
  blockNumber: parseInt,
  timestamp: (p) => {
    // Convert to seconds if its provided in ms
    if (p.length >= 13) {
      return parseInt(p) / 1000;
    }
    return parseInt(p);
  },
  limit: parseInt,
  start_time: (p) => new Date(p),
  end_time: (p) => new Date(p),
  addresses: (p) => p.split(','),
  snapshot: parseInt
};

class RestParsingUtil {
  static parseQuery(query, parseMapping = standardMapping) {
    const retval = {};
    for (const property in query) {
      retval[property] = parseMapping[property]?.call(null, query[property]) ?? query[property];
    }
    return retval;
  }

  // Returns true if the only defined properties on object are the given properties.
  static onlyHasProperties(object, properties) {
    const definedProperties = Object.keys(object);
    return definedProperties.length === properties.length && definedProperties.every((op) => properties.includes(op));
  }
}

module.exports = RestParsingUtil;
