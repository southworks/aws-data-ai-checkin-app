const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const { URL } = process.env;

var mp3FileName = process.argv[2];
fs.readFile(mp3FileName, async (err, res) => {
  if (err) console.log(err);
  const data = Buffer.from(res, 'ascii');

  const json = {
    Data: [
      {
        inputText: data,
        userId: "9671c425-002d-44e1-a1d4-705281ceecd4",
        audioUrl: "http://"
      }
    ]
  };

  const options = {
    method: 'PUT',
    data: json,
    url: URL,
  };
  const response = await axios(options);
  console.log(response.data);
});
