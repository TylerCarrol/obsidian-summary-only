import type { BasesQueryResult, BasesViewConfig, BasesViewRegistration } from 'obsidian';

export class BasesView {
	config!: BasesViewConfig;
	data!: BasesQueryResult;
}

export class RenderContext {}

export class QueryController {}

export abstract class Value {
	abstract toString(): string;
	abstract isTruthy(): boolean;

	renderTo(el: HTMLElement): void {
		el.textContent = this.toString();
	}
}

export class NullValue extends Value {
	toString(): string {
		return '';
	}

	isTruthy(): boolean {
		return false;
	}
}

export class Plugin {
	registerBasesView(_type: string, _registration: BasesViewRegistration): boolean {
		return true;
	}
}
