
class SubgraphQueryUtil {
  /**
   * Paginates a given subgraph query according to Graph Protocol's GraphQL API spec.
   * Only a single entity type should be requested at a time.
   * 
   * @param {function} subgraphClient 
   * @param {string} query - the query to be paginated. Must NOT include any where clause here.
   * @param {string} where - additional fields to search by, of the form `field: "${value}, ..."`
   * @param {string} paginateField - the field to paginate on
   * @param {string} firstValue - the initial value to begin with of the paginateField
   * @param {'asc' | 'desc'} paginateDirection - the direction to paginate
   * 
   * @returns all results matching the query
   */
  static async allPaginatedSG(subgraphClient, query, where, paginateField, firstValue, paginateDirection) {

    const PAGE_SIZE = 1000;
    const whereSuffix = paginateDirection === 'asc' ? '_gt' : '_lt';

    const retval = [];
    while (firstValue) {
      // Construct arguments for pagination
      const paginateArguments = `(where: {${paginateField}${whereSuffix}: "${firstValue}", ${where}}, first: ${PAGE_SIZE}, orderBy: ${paginateField}, orderDirection: ${paginateDirection})`
      let entityName = '';
      // Add the generated arguments to the query
      const paginatedQuery = query.replace(/(\w+)\s{/, (match, p1) => {
        entityName = p1;
        return `${entityName} ${paginateArguments} {`;
      });
      const result = await subgraphClient(paginatedQuery);
      // console.log(JSON.stringify(result));

      // Record the results and repeat as necessary
      retval.push(...result[entityName]);
      firstValue = result[entityName][PAGE_SIZE - 1]?.[paginateField];
    }
    return retval;
  }
}

module.exports = SubgraphQueryUtil;
