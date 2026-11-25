import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBasicHistoryPayload,
  filterAndSortHistory,
} from '../src/utils/historyHelpers.js';
import {
  INITIAL_CALCULATOR_STATE,
  reduceCalculatorState,
} from '../src/utils/calculators/basic.js';

test('buildBasicHistoryPayload saves single numbers and incomplete expressions as drafts without inventing results', () => {
  assert.equal(buildBasicHistoryPayload(''), null);

  const single = buildBasicHistoryPayload('100');
  assert.equal(single.status, 'draft');
  assert.equal(single.expression, '100');
  assert.equal(single.rawResult, '100');
  assert.equal(single.resultSummary, '100');

  const incomplete = buildBasicHistoryPayload('500+');
  assert.equal(incomplete.status, 'draft');
  assert.equal(incomplete.expression, '500+');
  assert.equal(incomplete.inputSummary, '500 +');
  assert.equal(incomplete.rawResult, '');
  assert.equal(incomplete.resultSummary, '');
});

test('buildBasicHistoryPayload saves unfinished expressions as drafts and finalized equals as completed', () => {
  const draftSum = buildBasicHistoryPayload('1250+250');
  assert.equal(draftSum.status, 'draft');
  assert.equal(draftSum.inputSummary, '1,250 + 250');
  assert.equal(draftSum.rawResult, '1500');
  assert.equal(draftSum.resultSummary, '1,500');

  const completedSum = buildBasicHistoryPayload('1250+250', { finalized: true });
  assert.equal(completedSum.status, 'completed');
  assert.equal(completedSum.inputSummary, '1,250 + 250');
  assert.equal(completedSum.rawResult, '1500');
  assert.equal(completedSum.resultSummary, '1,500');

  const completedMul = buildBasicHistoryPayload('500×25', { finalized: true });
  assert.equal(completedMul.status, 'completed');
  assert.equal(completedMul.rawResult, '12500');
  assert.equal(completedMul.resultSummary, '12,500');
});

test('reduceCalculatorState RESTORE restores expression and live result cleanly', () => {
  const restored = reduceCalculatorState(INITIAL_CALCULATOR_STATE, {
    type: 'RESTORE',
    expression: '1250+250',
  });
  assert.equal(restored.expression, '1250+250');
  assert.equal(restored.resultText, '1500');
  assert.equal(restored.justEvaluated, false);

  const restoredDraft = reduceCalculatorState(INITIAL_CALCULATOR_STATE, {
    type: 'RESTORE',
    expression: '500+',
  });
  assert.equal(restoredDraft.expression, '500+');
  assert.equal(restoredDraft.resultText, '500');
});

test('filterAndSortHistory filters starred calculations and sorts by recent star/update', () => {
  const items = [
    {
      id: 1,
      is_starred: 0,
      updated_at: '2026-11-25T10:00:00.000Z',
      starred_at: null,
    },
    {
      id: 2,
      is_starred: 1,
      updated_at: '2026-11-25T09:00:00.000Z',
      starred_at: '2026-11-25T12:00:00.000Z',
    },
    {
      id: 3,
      is_starred: 1,
      updated_at: '2026-11-25T11:00:00.000Z',
      starred_at: '2026-11-25T11:30:00.000Z',
    },
  ];

  const all = filterAndSortHistory(items, 'all');
  assert.deepEqual(
    all.map((i) => i.id),
    [3, 1, 2]
  );

  const starred = filterAndSortHistory(items, 'starred');
  assert.deepEqual(
    starred.map((i) => i.id),
    [2, 3]
  );
});
