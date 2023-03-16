"use strict";

const { XXHash32 } = require("xxhash-addon");

const hasher32 = new XXHash32(Buffer.from([0, 0, 0, 0]));

function pad(hash, len) {
  while (hash.length < len) {
    hash = "0" + hash;
  }
  return hash;
}

function fold(hash, text) {
  if (text.length === 0) {
    return hash;
  }
  hasher32.reset();
  hasher32.update(Buffer.from(hash.toString()));
  hasher32.update(Buffer.from(text));
  hash = hasher32.digest().toString("hex");
  return hash;
}

function foldObject(hash, o, seen) {
  return Object.keys(o).sort().reduce(foldKey, hash);
  function foldKey(hash, key) {
    return foldValue(hash, o[key], key, seen);
  }
}

function foldValue(input, value, key, seen) {
  var hash = fold(fold(fold(input, key), toString(value)), typeof value);
  if (value === null) {
    return fold(hash, "null");
  }
  if (value === undefined) {
    return fold(hash, "undefined");
  }
  if (typeof value === "object" || typeof value === "function") {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, "[Circular]" + key);
    }
    seen.push(value);

    var objHash = foldObject(hash, value, seen);

    if (!("valueOf" in value) || typeof value.valueOf !== "function") {
      return objHash;
    }

    try {
      return fold(objHash, String(value.valueOf()));
    } catch (err) {
      return fold(objHash, "[valueOf exception]" + (err.stack || err.message));
    }
  }
  return fold(hash, value.toString());
}

function toString(o) {
  return Object.prototype.toString.call(o);
}

function sum(o) {
  return pad(foldValue(0, o, "", []).toString(16), 8);
}

module.exports = sum;
