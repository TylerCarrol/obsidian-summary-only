import { Plugin } from 'obsidian';
import { SummaryOnlyView, SUMMARY_ONLY_VIEW_TYPE } from './summary-only-view';

export default class SummaryOnlyPlugin extends Plugin {
	onload() {
		this.registerBasesView(SUMMARY_ONLY_VIEW_TYPE, {
			name: 'Summary only',
			icon: 'lucide-chart-no-axes-combined',
			factory: (controller, containerEl) =>
				new SummaryOnlyView(controller, containerEl),
		});
	}
}
