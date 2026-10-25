// JSON that keeps every digit. A JSON number past 2^53 (a 64-bit id) comes
// out of JSON.parse rounded, and a body printed again, or merged into by a
// rule, would then carry digits the server never sent. While a body is parsed
// and printed again, such integers ride along as marked strings. The mark is
// NUL then '#', built at runtime: a NUL written in a hook string is a control character.

const EXACT = String.fromCharCode(0) + '#'
const TOKEN = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

/** JSON.parse, with integers JavaScript cannot hold exactly kept as they were written. */
export function parseExact(text) {
  return JSON.parse(text.replace(TOKEN, token =>
    token[0] !== '"' && /^-?\d+$/.test(token) && !Number.isSafeInteger(Number(token)) ? JSON.stringify(EXACT + token) : token))
}

/** JSON.stringify for a value from parseExact: the kept integers go back as numbers. */
export function stringifyExact(value, space) {
  return JSON.stringify(value, null, space).replace(/"\\u0000#(-?\d+)"/g, '$1')
}
