const logger = require("../../../modules/logger");

class BaseRepository {
  constructor(dbContext, tableName) {
    this.dbContext = dbContext;
    this.tableName = tableName;
  }

  async create(entity) {
    const entityItem = this.mapEntityToItem(entity, "create");
    const result = await this.dbContext.create(entityItem, this.tableName);

    if (!result.message) {
      return {
        group: entity,
      };
    }
    return result;
  }

  async update(entity, updateExpression, expressionAttributeValues) {
    const item = this.mapEntityToItem(entity, "update");

    const result = await this.dbContext.update(
      item,
      updateExpression,
      expressionAttributeValues,
      this.tableName
    );

    return this.mapItemToEntity(result.Attributes);
  }

  async delete(id) {
    logger.info(`Deleting with id: ${id}`);

    const result = await this.dbContext.delete(id, this.tableName);

    return this.mapItemToEntity(result.Attributes);
  }
  async find(id) {
    logger.info(`finding with id: ${id}`);
    const result = await this.dbContext.find(id, this.tableName);

    return this.mapItemToEntity(result.Item);
  }
  async findQuery(id) {
    logger.info(`finding with id: ${id} and without sorting key`);
    const result = await this.dbContext.findQuery(id, this.tableName);

    return this.mapItemToEntity(result.Items[0]);
  }
  async findCustomQuery(expression, keyCondition, filterExpression, asc) {
    logger.info(
      `custom finding with key condition: ${JSON.stringify(keyCondition)}`
    );
    const result = await this.dbContext.findCustomQuery(
      this.tableName,
      expression,
      keyCondition,
      filterExpression,
      asc
    );

    return this.mapItemsToEntities(result.Items);
  }
  async last(id, limit, groupId) {
    const feelings = [];
    let first = 0;
    let groups = [];
    logger.info(`finding last with id: ${id}`);
    logger.info(`finding last with groupId: ${groupId}`);
    const result = await this.dbContext.last(
      id,
      this.tableName,
      limit,
      groupId
    );
    logger.info(`search finished: ${JSON.stringify(result)}`);
    result.Items.forEach((feeling) => {
      if (feeling.sort.S.split("#")[0] !== first) {
        //add groups to last item array.
        if (feelings.length > 0) {
          feelings[feelings.length - 1].groups = groups;
          logger.info(`in adding groups${feelings[feelings.length - 1]}`);
          console.log(feelings[feelings.length - 1]);
          groups = [];
        }
        //put groups in null;
        logger.info(`first = ${first}`);
        feelings.push(this.mapItemToEntity(feeling));
        first = feeling.sort.S.split("#")[0];
      }
      //add groups.
      groups.push({ groupId: feeling.groupId.S.split("#")[1], name: "" });
    });
    if (feelings.length > 0) {
      feelings[feelings.length - 1].groups = groups;
    }
    return feelings;
  }
  async all() {
    const entities = [];

    const result = await this.dbContext.all(this.tableName);
    result.Items.forEach((item) => {
      entities.push(this.mapItemToEntity(item));
    });

    return entities;
  }
  async allByGlobalSecondaryIndex(id, globalField, asc) {
    const result = await this.dbContext.allByGlobalSecondaryIndex(
      id,
      this.tableName,
      globalField,
      asc
    );
    console.log(JSON.stringify(result.Items));
    return this.mapItemsToEntities(result.Items);
  }
  async scan(stk) {
    const result = await this.dbContext.scan(this.tableName, stk);
    console.log(`scan result ${JSON.stringify(result)}`);
    return this.mapItemsToEntities(result.Items);
  }
  mapItemToEntity() {
    throw new Error("Method not implemented.");
  }
  mapEntityToItem() {
    throw new Error("Method not implemented.");
  }
  mapItemsToEntities() {
    throw new Error("Method not implemented.");
  }
}

module.exports = BaseRepository;
