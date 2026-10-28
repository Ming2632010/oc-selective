import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseExamMathStimulus } from './exam-math-stimulus';
import { buildExamMathBank, examMathFamilies, makeExamMathFamilyItem } from './exam-math-bank';

describe('parseExamMathStimulus', () => {
  it('keeps bar, pie, line, table and diagram payloads', () => {
    assert.equal(parseExamMathStimulus({}), undefined);
    assert.equal(parseExamMathStimulus({ type: 'bar', bars: [{ label: 'A', value: 3 }] }), undefined);
    const bar = parseExamMathStimulus({
      type: 'bar',
      caption: 'Clubs',
      bars: [
        { label: 'Chess', value: 6 },
        { label: 'Drama', value: 11 },
      ],
    });
    assert.equal(bar?.type, 'bar');
    if (bar?.type === 'bar') assert.equal(bar.bars[1]?.value, 11);

    const pie = parseExamMathStimulus({
      type: 'pie',
      slices: [
        { label: 'Bus', value: 8 },
        { label: 'Walk', value: 4 },
      ],
    });
    assert.equal(pie?.type, 'pie');

    const table = parseExamMathStimulus({
      type: 'table',
      headers: ['Year', 'Books'],
      rows: [
        ['Year 4', '21'],
        ['Year 5', '30'],
      ],
    });
    assert.equal(table?.type, 'table');

    const clock = parseExamMathStimulus({ type: 'clock', hour: 4, minute: 30 });
    assert.equal(clock?.type, 'clock');
  });
});

describe('Selective Math visual bank', () => {
  const bank = buildExamMathBank();

  it('includes graph, table and diagram families', () => {
    const ids = examMathFamilies().map((family) => family.id);
    for (const id of ['bar-graph', 'pie-chart', 'data-table', 'line-graph', 'painted-grid']) {
      assert.equal(ids.includes(id), true, id);
    }
  });

  it('attaches a matching figure to visual families', () => {
    const expectType: Record<string, string> = {
      'bar-graph': 'bar',
      'pie-chart': 'pie',
      'data-table': 'table',
      'line-graph': 'line',
      'painted-grid': 'painted-grid',
      'clock-angle': 'clock',
      'scale-leftover': 'scale',
      'hidden-cubes': 'cube',
      'compound-area': 'compound-rect',
      'square-cut-perimeter': 'square-cut',
      'straight-angle': 'straight-angle',
      'grid-next': 'coord-grid',
      'mean-missing': 'table',
      'elapsed-timetable': 'table',
      'equal-area-rect': 'rect-pair',
    };
    for (const [familyId, type] of Object.entries(expectType)) {
      const items = bank.filter((item) => item.familyId === familyId);
      assert.ok(items.length > 0, familyId);
      for (const item of items) {
        assert.equal(item.stimulus?.type, type, `${familyId}: ${item.stem}`);
      }
    }
    const withFigure = bank.filter((item) => item.stimulus).length;
    assert.ok(withFigure >= 400, `expected many figures, got ${withFigure}`);
  });

  it('mints Strengthen follow-ups that keep the figure type', () => {
    const item = makeExamMathFamilyItem({
      familyId: 'bar-graph',
      band: 'standard',
      usedStems: bank.map((row) => row.stem),
      seed: 42,
    });
    assert.equal(item.stimulus?.type, 'bar');
    assert.equal(item.options.length, 5);
  });
});
