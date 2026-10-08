export interface SummaryCardDefinition {
	propertyId: string;
	summaryKey?: string;
}

export interface SummaryGroup<TEntry, TKey> {
	entries: TEntry[];
	key?: TKey;
	hasKey(): boolean;
}

export type SummaryScope<TEntry, TKey> =
	| { kind: 'ungrouped'; entries: TEntry[] }
	| { kind: 'all'; entries: TEntry[] }
	| { kind: 'group'; entries: TEntry[]; group: SummaryGroup<TEntry, TKey> };

export function getSummaryScopes<TEntry, TKey>(
	entries: TEntry[],
	groups: readonly SummaryGroup<TEntry, TKey>[],
	isGrouped: boolean,
	showAllSummary = true,
): SummaryScope<TEntry, TKey>[] {
	if (!isGrouped) {
		return [{ kind: 'ungrouped', entries }];
	}

	const scopes: SummaryScope<TEntry, TKey>[] = showAllSummary
		? [{ kind: 'all', entries }]
		: [];
	for (const group of groups) {
		scopes.push({ kind: 'group', entries: group.entries, group });
	}
	return scopes;
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