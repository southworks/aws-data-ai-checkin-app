const BaseRepositoryS3 = require("./base/BaseRepositoryS3");

class MessageRepository extends BaseRepositoryS3 {
  constructor(s3Context) {
    super(s3Context);
  }
  mapItemToEntity(item) {}
  mapItemsToEntities(items) {
    let messages = [];
    items.map((item) => {
      const DATA = {};
      DATA.id = item.Object.id;
      DATA.name = item.Key;
      DATA.sent = new Date().toLocaleString("es-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      DATA.lexResult = item.Object.lexResult;
      DATA.message = item.Object.inputText;
      messages = [...messages, DATA];
    });
    return messages;
  }
  mapEntityToItem(group) {}
}

module.exports = MessageRepository;
