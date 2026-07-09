/** Guías de indentación como indent-rainbow (líneas verticales por columna de tab). */

const INDENT_COLORS = 4;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderIndentPads(whitespace: string, tabSize: number): string {
	if (!whitespace) return '';

	let html = '';
	let level = 0;

	for (let i = 0; i < whitespace.length; ) {
		const chunk = whitespace.slice(i, i + tabSize);
		if (chunk.length < tabSize) {
			html += `<span class="indent-rainbow__pad indent-rainbow__pad--error" style="width:${chunk.length}ch"></span>`;
			break;
		}

		const isValid = chunk === ' '.repeat(tabSize);
		const colorClass = isValid
			? `indent-rainbow__pad--${level % INDENT_COLORS}`
			: 'indent-rainbow__pad--error';

		html += `<span class="indent-rainbow__pad ${colorClass}"></span>`;
		if (isValid) level += 1;
		i += tabSize;
	}

	return html;
}

function highlightJsonLine(line: string): string {
	if (!line.trim()) return '';

	let html = '';
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (char === '"') {
			let end = i + 1;
			while (end < line.length) {
				if (line[end] === '"' && line[end - 1] !== '\\') break;
				end += 1;
			}
			end += 1;

			const token = line.slice(i, end);
			const rest = line.slice(end);
			const isKey = /^\s*:/.test(rest);
			const className = isKey ? 'indent-rainbow__key' : 'indent-rainbow__string';
			html += `<span class="${className}">${escapeHtml(token)}</span>`;
			i = end;
			continue;
		}

		if (/[-\d]/.test(char) && (i === 0 || /[\s:[,{]/.test(line[i - 1] ?? ''))) {
			const match = line.slice(i).match(/^-?\d+(?:\.\d+)?/);
			if (match) {
				html += `<span class="indent-rainbow__number">${escapeHtml(match[0])}</span>`;
				i += match[0].length;
				continue;
			}
		}

		const literal = line.slice(i).match(/^(true|false|null)\b/);
		if (literal && (i === 0 || /[\s:[,{]/.test(line[i - 1] ?? ''))) {
			html += `<span class="indent-rainbow__literal">${escapeHtml(literal[0])}</span>`;
			i += literal[0].length;
			continue;
		}

		if ('{}[],:'.includes(char)) {
			html += `<span class="indent-rainbow__punct">${escapeHtml(char)}</span>`;
			i += 1;
			continue;
		}

		html += escapeHtml(char);
		i += 1;
	}

	return html;
}

export interface IndentRainbowOptions {
	tabSize?: number;
	highlight?: boolean;
}

export function renderIndentRainbowHtml(code: string, options: IndentRainbowOptions = {}): string {
	const tabSize = options.tabSize ?? 2;
	const highlight = options.highlight ?? true;

	return code
		.split('\n')
		.map((line) => {
			const match = line.match(/^(\s*)(.*)$/);
			const whitespace = match?.[1] ?? '';
			const content = match?.[2] ?? '';
			const pads = renderIndentPads(whitespace, tabSize);
			const contentHtml = highlight ? highlightJsonLine(content) : escapeHtml(content);

			return `<span class="indent-rainbow__line">${pads}<span class="indent-rainbow__text">${contentHtml || '&#8203;'}</span></span>`;
		})
		.join('');
}
