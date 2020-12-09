const AWS = require("aws-sdk");
const bucketS3 = require("@aws-cdk/aws-s3");

const s3 = new AWS.S3();

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

const createBucket = async (stack, bucket) => {
  console.log(bucket);
  if (!(await exists(bucket))) {
    console.log(`${bucket.name} BUCKET DOESN'T EXISTS`);
    const buckS3 = new bucketS3.Bucket(stack, bucket.name, {
      bucketName: bucket.name,
    });
  } else {
    console.log(`${bucket.name} BUCKET EXISTS`);
  }
};

module.exports = {
  exists,
  createBucket,
};
