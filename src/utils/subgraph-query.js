class SubgraphQueryUtil {
  /**
   * Paginates a given subgraph query according to Graph Protocol's GraphQL API spec.
   * Only a single entity type should be requested at a time.
   *
   * @param {function} subgraphClient
   * @param {string} query - the query to be paginated. Must NOT include any where clause here.
   * @param {string} block - (optional) block argument, of the form `block: {number: ${value}}`
   * @param {string} where - (optional) additional fields to search by, of the form `field: "${value}, ..."`
   * @param {object} pagination - the fields to paginate on, their prior values, and direction
   * @param {string} idColumn - the identity column. defaults to 'id'.
   * @returns all results matching the query
   *
   * Note that graphql can only order by a single field, and therefore it is possible for
   * some results to be skipped in the case of paginating by multiple fields
   */
  static async allPaginatedSG(subgraphClient, query, block, where, pagination, idColumn = 'id') {
    const PAGE_SIZE = 1000;
    const whereSuffix = pagination.direction === 'asc' ? '_gte' : '_lte';

    let prevPageIds = [];

    const retval = [];
    while (pagination.lastValue !== undefined) {
      // Construct arguments for pagination
      const whereClause = `{${pagination.field}${whereSuffix}: ${formatType(pagination.lastValue)}, ${where}}`;
      const paginateArguments = `(${block} where: ${whereClause} first: ${PAGE_SIZE} orderBy: ${pagination.field} orderDirection: ${pagination.direction})`;
      let entityName = '';
      // Add the generated arguments to the query
      const paginatedQuery = query.replace(/(\w+)\s{/, (match, p1) => {
        entityName = p1;
        return `${entityName} ${paginateArguments} {`;
      });
      const result = await subgraphClient(paginatedQuery);
      // console.log(JSON.stringify(result), paginatedQuery);
      if (result[entityName].length === 0) {
        return [];
      }

      if (!result[entityName][0][idColumn]) {
        throw new Error(`The result did not include the identity column '${idColumn}'.`);
      }

      // Record the results and repeat as necessary. Filter any repeated results on overlapping pages.
      const pageIds = [];
      for (const r of result[entityName]) {
        if (!prevPageIds.includes(r[idColumn])) {
          pageIds.push(r[idColumn]);
          retval.push(r);
        }
      }
      prevPageIds = pageIds;
      pagination.lastValue = result[entityName][PAGE_SIZE - 1]?.[pagination.field];
    }
    return retval;
  }
}

function formatType(value) {
  if (typeof value === 'number') {
    return value;
  } else {
    return `"${value}"`;
  }
}

module.exports = SubgraphQueryUtil;
