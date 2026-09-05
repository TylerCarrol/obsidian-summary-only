export interface SummaryCardDefinition {
	propertyId: string;
	summaryKey?: string;
}

export function getSummaryCardDefinitions(
	propertyOrder: readonly string[],
	summaries: Readonly<Record<string, string>>,
	showSummaryEditor = false,
): SummaryCardDefinition[] {
	return propertyOrder.flatMap((propertyId) => {
		const summaryKey = summaries[propertyId];
		return summaryKey === undefined && !showSummaryEditor
			? []
			: [{ propertyId, summaryKey }];
	});
}