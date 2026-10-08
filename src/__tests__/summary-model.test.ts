import { describe, expect, it } from 'vitest';
import { getSummaryCardDefinitions, getSummaryScopes } from '../summary-model';

describe('getSummaryScopes', () => {
	const entries = [10, 20, 5, 15];
	const groups = [
		{ key: 'Group B', entries: [5, 15], hasKey: () => true },
		{ key: 'Group A', entries: [10, 20], hasKey: () => true },
	];

	it('includes All first by default and preserves Base group order', () => {
		expect(getSummaryScopes(entries, groups, true)).toEqual([
			{ kind: 'all', entries },
			{ kind: 'group', entries: groups[0]!.entries, group: groups[0] },
			{ kind: 'group', entries: groups[1]!.entries, group: groups[1] },
		]);
	});

	it('removes only All when disabled', () => {
		expect(getSummaryScopes(entries, groups, true, false)).toEqual([
			{ kind: 'group', entries: groups[0]!.entries, group: groups[0] },
			{ kind: 'group', entries: groups[1]!.entries, group: groups[1] },
		]);
	});

	it.each([true, false])('preserves an ungrouped scope with All set to %s', (showAll) => {
		expect(getSummaryScopes(entries, groups, false, showAll)).toEqual([
			{ kind: 'ungrouped', entries },
		]);
	});

	it('keeps a single missing-value group distinct from an ungrouped scope', () => {
		const group = { entries, hasKey: () => false };
		expect(getSummaryScopes(entries, [group], true, false)).toEqual([
			{ kind: 'group', entries, group },
		]);
	});

	it('does not merge groups with identical labels', () => {
		const sameNameGroups = groups.map((group) => ({ ...group, key: 'All' }));
		expect(getSummaryScopes(entries, sameNameGroups, true)).toHaveLength(3);
	});

	it('uses original entry arrays without copying or aggregating them', () => {
		const scopes = getSummaryScopes(entries, groups, true);
		expect(scopes[0]!.entries).toBe(entries);
		expect(scopes[1]!.entries).toBe(groups[0]!.entries);
	});

	it('keeps All for empty grouped results when enabled', () => {
		expect(getSummaryScopes([], [], true)).toEqual([{ kind: 'all', entries: [] }]);
		expect(getSummaryScopes([], [], true, false)).toEqual([]);
	});
});

describe('getSummaryCardDefinitions', () => {
	it('keeps configured summaries in property order', () => {
		expect(
			getSummaryCardDefinitions(
				['file.name', 'file.size', 'number'],
				{ number: 'Sum', 'file.size': 'Average' },
			),
		).toEqual([
			{ propertyId: 'file.size', summaryKey: 'Average' },
			{ propertyId: 'number', summaryKey: 'Sum' },
		]);
	});

	it('returns no cards when summaries are not configured', () => {
		expect(getSummaryCardDefinitions(['number'], {})).toEqual([]);
	});

	it('returns every ordered property when the summary editor is shown', () => {
		expect(
			getSummaryCardDefinitions(
				['file.name', 'file.size', 'number'],
				{ number: 'Sum' },
				true,
			),
		).toEqual([
			{ propertyId: 'file.name', summaryKey: undefined },
			{ propertyId: 'file.size', summaryKey: undefined },
			{ propertyId: 'number', summaryKey: 'Sum' },
		]);
	});

	it('ignores summaries for properties outside the view order', () => {
		expect(
			getSummaryCardDefinitions(['number'], {
				number: 'Sum',
				'file.size': 'Average',
			}),
		).toEqual([{ propertyId: 'number', summaryKey: 'Sum' }]);
	});
});