import {
	BasesConfigFileView,
	BasesEntry,
	BasesPropertyId,
	BasesView,
	BasesViewConfig,
	NullValue,
	QueryController,
	RenderContext,
} from 'obsidian';
import { getSummaryCardDefinitions, getSummaryScopes } from './summary-model';

export const SUMMARY_ONLY_VIEW_TYPE = 'summary-only';

type SummaryConfiguration = Record<string, string>;

export const SUMMARY_OPTIONS: Record<string, string> = {
	Sum: 'Sum',
	Average: 'Average',
	Min: 'Min',
	Max: 'Max',
	Range: 'Range',
	Median: 'Median',
	Stddev: 'Stddev',
	Earliest: 'Earliest',
	Latest: 'Latest',
	Checked: 'Checked',
	Unchecked: 'Unchecked',
	Empty: 'Empty',
	Filled: 'Filled',
	Unique: 'Unique',
};

export class SummaryOnlyView extends BasesView {
	readonly type = SUMMARY_ONLY_VIEW_TYPE;

	private readonly containerEl: HTMLElement;
	private readonly controller: QueryController;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.controller = controller;
		this.containerEl = parentEl.createDiv('summary-only-view');
	}

	onDataUpdated(): void {
		this.containerEl.empty();
		this.containerEl.style.setProperty(
			'--summary-only-card-width',
			`${getDimension(this.config.get('cardWidth'), 288)}px`,
		);
		this.containerEl.style.setProperty(
			'--summary-only-card-height',
			`${getDimension(this.config.get('cardHeight'), 112)}px`,
		);

		const summaries = getSummaryConfiguration(this.config);
		const showSummaryEditor = this.config.get('showSummaryEditor') === true;
		const cards = getSummaryCardDefinitions(
			this.config.getOrder(),
			summaries,
			showSummaryEditor,
		);

		if (cards.length === 0) {
			this.containerEl.createDiv({
				cls: 'summary-only-empty',
				text: 'No summaries configured for this view.',
			});
			return;
		}

		const serializedConfig = this.config as BasesViewConfig &
			Partial<BasesConfigFileView>;
		const scopes = getSummaryScopes(
			this.data.data,
			this.data.groupedData,
			serializedConfig.groupBy != null,
			this.config.get('showAllSummary') !== false,
		);
		if (scopes.length === 0) {
			this.containerEl.createDiv({
				cls: 'summary-only-empty',
				text: 'No results for this view.',
			});
			return;
		}

		for (const scope of scopes) {
			let parentEl = this.containerEl;
			if (scope.kind !== 'ungrouped') {
				parentEl = this.containerEl.createEl('section', {
					cls: 'summary-only-group',
				});
				const headingEl = parentEl.createEl('h3', {
					cls: 'summary-only-group-title',
				});
				if (scope.kind === 'all') {
					headingEl.setText('All');
				} else if (scope.group.hasKey() && scope.group.key !== undefined) {
					scope.group.key.renderTo(headingEl, new RenderContext());
				} else {
					headingEl.setText('No value');
				}
			}

			const cardsEl = parentEl.createDiv('summary-only-cards');
			for (const card of cards) {
				this.renderCard(
					cardsEl,
					card.propertyId as BasesPropertyId,
					card.summaryKey,
					showSummaryEditor,
					scope.entries,
				);
			}
		}
	}

	private renderCard(
		parentEl: HTMLElement,
		propertyId: BasesPropertyId,
		summaryKey: string | undefined,
		showSummaryEditor: boolean,
		entries: BasesEntry[],
	): void {
		const cardEl = parentEl.createDiv('summary-only-card');
		cardEl.createDiv({
			cls: 'summary-only-card-title',
			text: this.config.getDisplayName(propertyId),
		});

		const metricEl = cardEl.createDiv('summary-only-card-metric');
		if (showSummaryEditor) {
			const selectEl = metricEl.createEl('select', {
				cls: 'summary-only-card-summary',
				attr: {
					'aria-label': `Summary for ${this.config.getDisplayName(propertyId)}`,
				},
			});
			selectEl.createEl('option', { text: 'No summary', value: '' });
			for (const [value, label] of Object.entries(SUMMARY_OPTIONS)) {
				selectEl.createEl('option', { text: label, value });
			}
			selectEl.value = summaryKey ?? '';
			selectEl.addEventListener('change', () => {
				const summaries = getSummaryConfiguration(this.config);
				if (selectEl.value === '') {
					delete summaries[propertyId];
				} else {
					summaries[propertyId] = selectEl.value;
				}
				this.config.set('summaries', summaries);
				this.onDataUpdated();
			});
		} else {
			metricEl.createDiv({
				cls: 'summary-only-card-label',
				text: summaryKey,
			});
		}

		const valueEl = metricEl.createDiv('summary-only-card-value');
		if (summaryKey === undefined) {
			valueEl.setText('-');
			return;
		}
		const value = this.data.getSummaryValue(
			this.controller,
			entries,
			propertyId,
			summaryKey,
		);

		if (value instanceof NullValue) {
			valueEl.setText('-');
		} else {
			value.renderTo(valueEl, new RenderContext());
		}
	}
}

function getSummaryConfiguration(config: BasesViewConfig): SummaryConfiguration {
	const serializedConfig = config as BasesViewConfig &
		Partial<BasesConfigFileView>;
	return serializedConfig.summaries ?? {};
}

function getDimension(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
		? value
		: fallback;
}