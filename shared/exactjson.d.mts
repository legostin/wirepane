// Types of shared/exactjson.mjs, for the hooks module.

/** JSON.parse, with integers JavaScript cannot hold exactly kept as they were written. */
export function parseExact(text: string): unknown

/** JSON.stringify for a value from parseExact: the kept integers go back as numbers. */
export function stringifyExact(value: unknown, space?: number): string
