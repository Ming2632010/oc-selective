import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PROGRAMS,
  buildHeaderNav,
  getProgram,
  homePrograms,
  navPrograms,
  publicPrograms,
  type Program,
} from './programs';

describe('programs catalogue', () => {
  it('puts K–Y1 in the header and homepage without listing later years yet', () => {
    const nav = navPrograms();
    assert.deepEqual(
      nav.map((program) => program.id),
      ['k-y1', 'oc', 'selective'],
    );
    assert.equal(getProgram('k-y1').navLabel, 'K–Y1');
    assert.equal(getProgram('k-y1').hasPage, true);
    assert.equal(getProgram('y2').inNav, false);
    assert.equal(getProgram('y6').hasPage, false);
    assert.deepEqual(
      homePrograms().map((program) => program.id),
      ['selective', 'oc', 'k-y1'],
    );
  });

  it('keeps a single year as a top-level header link', () => {
    const items = buildHeaderNav();
    assert.deepEqual(
      items.map((item) => (item.type === 'link' ? item.label : item.label)),
      ['K–Y1', 'OC Trials', 'Selective Trials'],
    );
    assert.equal(items[0]?.type, 'link');
  });

  it('groups year programs into a Years dropdown once more than one is in the menu', () => {
    const withY2: Program[] = PROGRAMS.map((program) =>
      program.id === 'y2' ? { ...program, inNav: true, hasPage: true } : program,
    );
    const items = buildHeaderNav(withY2);
    assert.equal(items[0]?.type, 'group');
    if (items[0]?.type !== 'group') return;
    assert.equal(items[0].label, 'Years');
    assert.deepEqual(
      items[0].items.map((item) => item.label),
      ['K–Y1', 'Y2'],
    );
    assert.deepEqual(
      items.slice(1).map((item) => (item.type === 'link' ? item.label : item.label)),
      ['OC Trials', 'Selective Trials'],
    );
  });

  it('only publishes programs that have a page', () => {
    assert.deepEqual(
      publicPrograms().map((program) => program.href),
      ['/k-y1', '/oc-trial', '/selective-trial'],
    );
  });
});
