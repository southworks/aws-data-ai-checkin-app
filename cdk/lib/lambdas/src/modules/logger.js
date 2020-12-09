"use strict";

/* eslint-disable no-console */

const error = (message) => console.error(message);

const warn = (message) => console.warn(message);

const info = (message) => console.info(message);

const debug = (message) => console.debug(message);

const log = (message) => console.log(message);

module.exports = {
  error,
  warn,
  info,
  debug,
  log,
};
