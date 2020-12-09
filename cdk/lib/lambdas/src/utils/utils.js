const getValueOrDefault = (obj, path, def) => {
  const propNames = path.replace(/\]|\)/, "").split(/\.|\[|\(/);

  return propNames.reduce(
    (acc, prop) => (acc && acc[prop] ? acc[prop] : def),
    obj
  );
};

module.exports = {
  getValueOrDefault,
};
