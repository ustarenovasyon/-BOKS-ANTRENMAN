import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server = await createServer({optimizeDeps: {noDiscovery: true, entries: []},server: {middlewareMode: true}, appType: 'custom', logLevel: 'error'});
try {
  const {TARGET_PROGRAM_DURATIONS, buildExtendedTimeline, resolveTrainingCycle} = await server.ssrLoadModule('/src/features/boxing/curriculum/longTermTimelinePolicy.js');
  for (const duration of TARGET_PROGRAM_DURATIONS) for (const experience of ['beginner','intermediate','experienced']) for (const total of [1,2,3,5,13,104,416]) {
    const timeline = buildExtendedTimeline(duration, experience, total);
    assert.deepEqual(timeline, buildExtendedTimeline(duration, experience, total));
    assert.equal(timeline.segments[0].start, 1);
    assert.equal(timeline.segments.at(-1).end, total);
    for (let i=1;i<timeline.segments.length;i++) {
      assert.equal(timeline.segments[i].start, timeline.segments[i-1].end+1);
      assert.equal(timeline.segments[i].stage, timeline.segments[i-1].stage+1);
    }
  }
  assert.equal(buildExtendedTimeline(7,'beginner',104),null);
  assert.equal(buildExtendedTimeline(24,'unknown',104),null);
  assert.equal(resolveTrainingCycle({durationMonths:24,programWeekIndex:4}).recovery,true);
  assert.equal(resolveTrainingCycle({durationMonths:6,programWeekIndex:4}).recovery,false);
  assert.equal(buildExtendedTimeline(24,'beginner',416).maxStage,6);
  console.log('PASS part38: all durations/experience timelines contiguous; recovery policy deterministic');
} finally { await server.close(); }
