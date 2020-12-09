module.exports = {
  Ok: (body) => {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  },
  Created: (body) => {
    return {
      statusCode: 201,
      body: JSON.stringify(body),
    };
  },
  NoContent: () => {
    return {
      statusCode: 204,
    };
  },
  BadRequest: (message) => {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: message,
      }),
    };
  },
  Unauthorized: (message) => {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: message,
      }),
    };
  },
  Forbidden: (message) => {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: message,
      }),
    };
  },
  NotFound: (message) => {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: message,
      }),
    };
  },
  InternalServerError: (message) => {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: message,
      }),
    };
  },
};
