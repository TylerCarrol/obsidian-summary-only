import { describe, expect, it } from 'vitest';
import { getSummaryCardDefinitions } from '../summary-model';

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

	it('ignores summaries for properties outside the view order', () => {
		expect(
			getSummaryCardDefinitions(['number'], {
				number: 'Sum',
				'file.size': 'Average',
			}),
		).toEqual([{ propertyId: 'number', summaryKey: 'Sum' }]);
	});
});