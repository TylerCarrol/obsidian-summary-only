export interface SummaryCardDefinition {
	propertyId: string;
	summaryKey: string;
}

export function getSummaryCardDefinitions(
	propertyOrder: readonly string[],
	summaries: Readonly<Record<string, string>>,
): SummaryCardDefinition[] {
	return propertyOrder.flatMap((propertyId) => {
		const summaryKey = summaries[propertyId];
		return summaryKey === undefined ? [] : [{ propertyId, summaryKey }];
	});
}