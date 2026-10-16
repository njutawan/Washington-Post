import { consumeLimit } from '../src/lib/rate-limit';
import { toggleBookmark } from '../src/lib/db';
import { closeDatabase } from '../src/lib/storage';
try {
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      consumeLimit('parallel-regression', 30, 60000),
    ),
  );
  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      toggleBookmark(
        process.env.TEST_ACCOUNT_ID!,
        'worker-' + process.pid + '-' + i,
      ),
    ),
  );
  console.log(
    JSON.stringify({ accepted: results.filter((r) => r.allowed).length }),
  );
} finally {
  await closeDatabase();
}
