import { Plugin } from 'obsidian';
import {
	SummaryOnlyView,
	SUMMARY_ONLY_VIEW_TYPE,
} from './summary-only-view';

export default class SummaryOnlyPlugin extends Plugin {
	onload() {
		this.registerBasesView(SUMMARY_ONLY_VIEW_TYPE, {
			name: 'Summary only',
			icon: 'lucide-chart-no-axes-combined',
			factory: (controller, containerEl) =>
				new SummaryOnlyView(controller, containerEl),
			options: () => [
				{
					type: 'toggle',
					key: 'showSummaryEditor',
					displayName: 'Show summary editor',
					default: false,
				},
				{
					type: 'slider',
					key: 'cardWidth',
					displayName: 'Card width',
					min: 100,
					max: 480,
					step: 10,
					default: 288,
				},
				{
					type: 'slider',
					key: 'cardHeight',
					displayName: 'Card height',
					min: 80,
					max: 320,
					step: 8,
					default: 80,
				},
			],
		});
	}
}
