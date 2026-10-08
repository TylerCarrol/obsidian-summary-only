import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	App,
	BasesEntry,
	BasesEntryGroup,
	BasesPropertyId,
	BasesQueryResult,
	BasesViewConfig,
	NullValue,
	QueryController,
	Value,
} from 'obsidian';
import SummaryOnlyPlugin from '../main';
import { SummaryOnlyView } from '../summary-only-view';

class TestValue extends Value {
	constructor(private readonly raw: string | number | boolean) {
		super();
	}

	toString(): string {
		return String(this.raw);
	}

	isTruthy(): boolean {
		return Boolean(this.raw);
	}

	renderTo(el: HTMLElement): void {
		el.textContent = this.toString();
	}
}

function entry(number: number): BasesEntry {
	return { getValue: () => new TestValue(number) } as BasesEntry;
}

function group(key: string | number | boolean | null, entries: BasesEntry[]): BasesEntryGroup {
	return {
		key: key === null ? new NullValue() : new TestValue(key),
		entries,
		hasKey: () => key !== null,
	};
}

const controller = new QueryController();

function setup(options: {
	grouped?: boolean;
	showAll?: boolean;
	editor?: boolean;
	groups?: BasesEntryGroup[];
	summaries?: Record<string, string>;
	order?: BasesPropertyId[];
} = {}) {
	const groupA = group('Group A', [entry(10), entry(20)]);
	const groupB = group('Group B', [entry(5), entry(15)]);
	const groups = options.groups ?? [groupA, groupB];
	const entries = groups.flatMap((item) => item.entries);
	const settings: Record<string, unknown> = {
		showAllSummary: options.showAll,
		showSummaryEditor: options.editor,
	};
	const config = {
		name: 'Test view',
		groupBy: options.grouped === false ? undefined : { property: 'note.group' },
		summaries: options.summaries ?? { 'note.number': 'Sum' },
		get: (key: string) => settings[key],
		getOrder: (): BasesPropertyId[] => options.order ?? ['note.number'],
		getAsPropertyId: () => null,
		getEvaluatedFormula: () => new NullValue(),
		getSort: () => [],
		getDisplayName: (property: string) => property,
		set: vi.fn((key: string, value: unknown) => {
			if (key === 'summaries') {
				config.summaries = value as Record<string, string>;
			} else {
				settings[key] = value;
			}
		}),
	};
	const getSummaryValue = vi.fn((
		_controller: QueryController,
		items: BasesEntry[],
		property: BasesPropertyId,
		summary: string,
	): Value => {
		if (summary === 'Missing') {
			return new NullValue();
		}
		const sum = items.reduce((total, item) => total + Number(item.getValue(property)?.toString()), 0);
		return new TestValue(summary === 'Average' && items.length > 0 ? sum / items.length : sum);
	});
	const data = {
		data: entries,
		groupedData: groups,
		getSummaryValue,
	} as BasesQueryResult;
	const parent = document.createElement('div');
	const view = new SummaryOnlyView(controller, parent);
	view.config = config;
	view.data = data;
	view.onDataUpdated();
	return { view, parent, config, data, groups, settings, getSummaryValue };
}

function headings(parent: HTMLElement): (string | null)[] {
	return Array.from(parent.querySelectorAll('h3'), (el) => el.textContent);
}

function values(parent: HTMLElement): (string | null)[] {
	return Array.from(parent.querySelectorAll('.summary-only-card-value'), (el) => el.textContent);
}

beforeAll(() => {
	function createEl(
		this: HTMLElement,
		tag: string,
		options: { cls?: string; text?: string; value?: string; attr?: Record<string, string> } = {},
	): HTMLElement {
		const el = document.createElement(tag);
		el.className = options.cls ?? '';
		el.textContent = options.text ?? '';
		if (options.value !== undefined) {
			el.setAttribute('value', options.value);
		}
		for (const [key, value] of Object.entries(options.attr ?? {})) {
			el.setAttribute(key, value);
		}
		this.appendChild(el);
		return el;
	}
	Object.defineProperties(HTMLElement.prototype, {
		createEl: { configurable: true, value: createEl },
		createDiv: {
			configurable: true,
			value(this: HTMLElement, options: string | { cls?: string; text?: string }) {
				return createEl.call(this, 'div', typeof options === 'string' ? { cls: options } : options);
			},
		},
		empty: { configurable: true, value(this: HTMLElement) { this.replaceChildren(); } },
		setText: { configurable: true, value(this: HTMLElement, text: string) { this.textContent = text; } },
	});
});

afterAll(() => {
	for (const key of ['createEl', 'createDiv', 'empty', 'setText']) {
		Reflect.deleteProperty(HTMLElement.prototype, key);
	}
});

describe('SummaryOnlyView groups', () => {
	it('shows All first by default and calculates each group from its own entries', () => {
		const { parent, data, groups, getSummaryValue } = setup();
		expect(headings(parent)).toEqual(['All', 'Group A', 'Group B']);
		expect(values(parent)).toEqual(['50', '30', '20']);
		expect(getSummaryValue).toHaveBeenNthCalledWith(1, controller, data.data, 'note.number', 'Sum');
		expect(getSummaryValue).toHaveBeenNthCalledWith(2, controller, groups[0]!.entries, 'note.number', 'Sum');
		expect(getSummaryValue).toHaveBeenNthCalledWith(3, controller, groups[1]!.entries, 'note.number', 'Sum');
	});

	it('hides All without hiding groups', () => {
		const { parent } = setup({ showAll: false });
		expect(headings(parent)).toEqual(['Group A', 'Group B']);
		expect(values(parent)).toEqual(['30', '20']);
	});

	it('preserves the group order supplied by the Base', () => {
		const { parent } = setup({
			groups: [group('Group B', [entry(20)]), group('Group A', [entry(30)])],
		});
		expect(headings(parent)).toEqual(['All', 'Group B', 'Group A']);
		expect(values(parent)).toEqual(['50', '20', '30']);
	});

	it.each([true, false])('keeps the ungrouped layout when All is %s', (showAll) => {
		const { parent } = setup({ grouped: false, showAll });
		expect(headings(parent)).toEqual([]);
		expect(values(parent)).toEqual(['50']);
		expect(parent.querySelectorAll('.summary-only-cards')).toHaveLength(1);
	});

	it('renders a single missing-value group as No value', () => {
		const { parent } = setup({ groups: [group(null, [entry(7)])] });
		expect(headings(parent)).toEqual(['All', 'No value']);
		expect(values(parent)).toEqual(['7', '7']);
	});

	it('preserves zero, false, native-rendered labels, and groups named All', () => {
		const groups = [
			group(0, [entry(0)]),
			group(false, [entry(2)]),
			group('All', [entry(3)]),
			group('<script>text</script>', [entry(4)]),
		];
		const render = vi.spyOn(groups[0]!.key!, 'renderTo');
		const { parent } = setup({ groups });
		expect(headings(parent)).toEqual(['All', '0', 'false', 'All', '<script>text</script>']);
		expect(values(parent)).toEqual(['9', '0', '2', '3', '4']);
		expect(render).toHaveBeenCalledOnce();
		expect(parent.querySelector('script')).toBeNull();
	});

	it('keeps multiple summary properties in order within every group', () => {
		const { parent } = setup({
			order: ['file.size', 'note.number'],
			summaries: { 'note.number': 'Sum', 'file.size': 'Average' },
		});
		for (const section of Array.from(parent.querySelectorAll('section'))) {
			expect(Array.from(section.querySelectorAll('.summary-only-card-title'), (el) => el.textContent))
				.toEqual(['file.size', 'note.number']);
		}
		expect(values(parent)).toEqual(['12.5', '50', '15', '30', '10', '20']);
	});

	it('keeps placeholders for missing summary results', () => {
		const { parent } = setup({ summaries: { 'note.number': 'Missing' } });
		expect(values(parent)).toEqual(['-', '-', '-']);
	});

	it('persists editor changes and updates every section', () => {
		const { parent, config } = setup({ editor: true });
		const select = parent.querySelector('select')!;
		select.value = 'Average';
		select.dispatchEvent(new Event('change'));
		expect(config.set).toHaveBeenCalledWith('summaries', { 'note.number': 'Average' });
		expect(values(parent)).toEqual(['12.5', '15', '10']);
		expect(Array.from(parent.querySelectorAll('select'), (el) => el.value))
			.toEqual(['Average', 'Average', 'Average']);
		parent.querySelector('select')!.value = '';
		parent.querySelector('select')!.dispatchEvent(new Event('change'));
		expect(config.summaries).toEqual({});
		expect(values(parent)).toEqual(['-', '-', '-']);
	});

	it('replaces sections after data, grouping, and setting updates', () => {
		const { parent, view, data, config, settings } = setup();
		data.data = [entry(8)];
		data.groupedData = [group('Group C', data.data)];
		view.onDataUpdated();
		expect(headings(parent)).toEqual(['All', 'Group C']);
		expect(values(parent)).toEqual(['8', '8']);
		settings.showAllSummary = false;
		view.onDataUpdated();
		expect(headings(parent)).toEqual(['Group C']);
		config.groupBy = undefined;
		view.onDataUpdated();
		expect(headings(parent)).toEqual([]);
		expect(values(parent)).toEqual(['8']);
	});

	it('shows the no-summary message before empty-result handling', () => {
		const { parent } = setup({ summaries: {}, groups: [], showAll: false });
		expect(parent.textContent).toBe('No summaries configured for this view.');
	});

	it('shows an empty-result message when there are no sections', () => {
		const { parent } = setup({ groups: [], showAll: false });
		expect(parent.textContent).toBe('No results for this view.');
	});

	it('keeps an All section for empty grouped results when enabled', () => {
		const { parent } = setup({ groups: [] });
		expect(headings(parent)).toEqual(['All']);
		expect(values(parent)).toEqual(['0']);
	});
});

describe('view registration', () => {
	it('registers Show All summary as a default-on per-view toggle', () => {
		const plugin = new SummaryOnlyPlugin({} as App, {
			id: 'summary-only',
			name: 'SummaryOnly',
			version: '0.1.2',
			minAppVersion: '1.13.0',
			description: 'Base view that shows summaries only.',
		});
		const register = vi.spyOn(plugin, 'registerBasesView');
		plugin.onload();
		const registration = register.mock.calls[0]![1];
		expect(registration.options?.({} as BasesViewConfig)).toContainEqual({
			type: 'toggle',
			key: 'showAllSummary',
			displayName: 'Show All summary',
			default: true,
		});
	});
});
