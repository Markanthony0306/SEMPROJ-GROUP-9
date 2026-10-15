
import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const raw = await readFile(
  new URL('../server/data.json', import.meta.url),
  'utf8'
);

const data = JSON.parse(raw);

function inspect(value, depth = 0) {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      count: value.length,
      sample: value.length ? inspect(value[0], depth + 1) : null,
    };
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const sensitive = /password|secret|token|jwt|hash|credential/i.test(key);

        if (sensitive) {
          return [key, '[REDACTED]'];
        }

        if (Array.isArray(item)) {
          return [key, {
            type: 'array',
            count: item.length,
            sample: item.length ? inspect(item[0], depth + 1) : null,
          }];
        }

        if (item && typeof item === 'object') {
          return [key, depth < 2 ? inspect(item, depth + 1) : '[object]'];
        }

        return [key, typeof item];
      })
    );
  }

  return typeof value;
}

console.log(JSON.stringify(inspect(data), null, 2));
