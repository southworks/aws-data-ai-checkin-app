const Entity = require("./base/Entity");

class Feeling extends Entity {
  constructor(
    id,
    userId,
    dateTime,
    audioUrl,
    sentiment,
    message,
    recognizedBy,
    s3Path
  ) {
    super(id);
    this.userId = userId;
    this.dateTime = dateTime;
    this.audioUrl = audioUrl;
    this.sentiment = sentiment;
    this.message = message;
    this.recognizedBy = recognizedBy;
    this.s3Path = s3Path;
  }
}

module.exports = Feeling;
