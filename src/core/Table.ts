import T from 'cli-table';

class Table extends T {
	constructor(
		head: string[],
		compact: boolean = false,
		headingColor: string = 'magenta'
	) {
		super({
			head,
			style: {
				head: [headingColor],
				compact
			}
		});
	}
}

export default Table;
