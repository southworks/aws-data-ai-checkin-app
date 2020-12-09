const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const updateData = async (bucket) => {
  const params = {
    Bucket: bucket.name,
    Key: bucket.key,
    Body: bucket.body,
  };
  try {
    return await s3.upload(params).promise();
  } catch (err) {
    console.log(`Error in uploading file on s3 due to ${err}`);
  }
};

const exists = async (bucket) => {
  const options = {
    Bucket: bucket.name,
  };
  try {
    await s3.headBucket(options).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
};

const deleteDatas = async (objects) => {
  console.log(JSON.stringify(objects));
  const data = await s3.deleteObjects(objects).promise();
  console.log(data);
  return data;
};

module.exports = {
  exists,
  updateData,
  deleteDatas,
};
