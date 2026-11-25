import type { BasesQueryResult, BasesViewConfig, BasesViewRegistration } from 'obsidian';

export class BasesView {
	config!: BasesViewConfig;
	data!: BasesQueryResult;
}

export class RenderContext {}

export class QueryController {}

export abstract class Value {
	static equals(a: Value | null, b: Value | null): boolean {
		return a instanceof NumberValue && b instanceof NumberValue
			? a.value === b.value
			: a === b;
	}

	abstract toString(): string;
	abstract isTruthy(): boolean;

	renderTo(el: HTMLElement): void {
		el.textContent = this.toString();
	}
}

export class NumberValue extends Value {
	constructor(readonly value: number) {
		super();
	}

	toString(): string {
		return String(this.value);
	}

	isTruthy(): boolean {
		return Boolean(this.value);
	}
}

export class StringValue extends Value {
	constructor(readonly value: string) {
		super();
	}

	toString(): string {
		return this.value;
	}

	isTruthy(): boolean {
		return Boolean(this.value);
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
