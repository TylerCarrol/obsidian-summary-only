import {
	BasesConfigFileView,
	BasesPropertyId,
	BasesView,
	BasesViewConfig,
	QueryController,
	RenderContext,
} from 'obsidian';
import { getSummaryCardDefinitions } from './summary-model';

export const SUMMARY_ONLY_VIEW_TYPE = 'summary-only';

type SummaryConfiguration = Record<string, string>;

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
		const cards = getSummaryCardDefinitions(this.config.getOrder(), summaries);

		if (cards.length === 0) {
			this.containerEl.createDiv({
				cls: 'summary-only-empty',
				text: 'No summaries configured for this view.',
			});
			return;
		}

		const cardsEl = this.containerEl.createDiv('summary-only-cards');
		for (const card of cards) {
			this.renderCard(
				cardsEl,
				card.propertyId as BasesPropertyId,
				card.summaryKey,
			);
		}
	}

	private renderCard(
		parentEl: HTMLElement,
		propertyId: BasesPropertyId,
		summaryKey: string,
	): void {
		const cardEl = parentEl.createDiv('summary-only-card');
		cardEl.createDiv({
			cls: 'summary-only-card-title',
			text: this.config.getDisplayName(propertyId),
		});

		const metricEl = cardEl.createDiv('summary-only-card-metric');
		metricEl.createDiv({
			cls: 'summary-only-card-label',
			text: summaryKey,
		});

		const valueEl = metricEl.createDiv('summary-only-card-value');
		const value = this.data.getSummaryValue(
			this.controller,
			this.data.data,
			propertyId,
			summaryKey,
		);

		if (value.isTruthy()) {
			value.renderTo(valueEl, new RenderContext());
		} else {
			valueEl.setText('-');
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