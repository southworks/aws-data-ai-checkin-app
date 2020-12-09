const Feeling = require("../../models/Feeling");
const { getValueOrDefault } = require("./../../utils/utils");
const BaseRepository = require("./base/BaseRepository");
const config = require("./../../config.json");

class FeelingRepository extends BaseRepository {
  constructor(dbContext) {
    super(dbContext, config.aws.dynamoDB.feelingTable.name);
  }
  mapItemToEntity(item) {
    const feelingMapped = {
      id: getValueOrDefault(item, "id.S", null),
      dateTime: getValueOrDefault(item, "dateTime.N", null),
      userId: getValueOrDefault(item, "userId.S", null),
      audioUrl: getValueOrDefault(item, "audioUrl.S", null),
      sentiment: getValueOrDefault(item, "sentiment.S", null),
      message: getValueOrDefault(item, "message.S", null),
      recognizedBy: getValueOrDefault(item, "recognizedBy.S", null),
      s3Path: getValueOrDefault(item, "s3Path.S", null),
    };

    return new Feeling(
      feelingMapped.id,
      feelingMapped.userId,
      feelingMapped.dateTime,
      feelingMapped.audioUrl,
      feelingMapped.sentiment,
      feelingMapped.message,
      feelingMapped.recognizedBy,
      feelingMapped.s3Path
    );
  }

  mapItemsToEntities(items) {
    const mappedFeelings = [];
    items.forEach((item) => {
      mappedFeelings.push(this.mapItemToEntity(item));
    });
    return mappedFeelings;
  }

  mapEntityToItem(feeling) {
    return {
      id: {
        S: feeling.id,
      },
      dateTime: {
        N: feeling.dateTime,
      },
      audioUrl: {
        S: feeling.audioUrl,
      },
      sentiment: {
        S: feeling.intentName,
      },
      message: {
        S: feeling.inputText,
      },
      recognizedBy: {
        S: feeling.recognizedBy,
      },
      userId: {
        S: feeling.userId,
      },
      s3Path: feeling.s3Path
        ? {
            S: feeling.s3Path,
          }
        : { NULL: true },
    };
  }
}

module.exports = FeelingRepository;
