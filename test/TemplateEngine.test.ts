import { describe, expect, it } from 'vitest';
import TemplateEngine from 'src/template/TemplateEngine';

const engine = new TemplateEngine();

describe('TemplateEngine', () => {
    it('renders variables and simple patterns', () => {
        expect(engine.render('{{ title }} – %date%', { title: 'Hello', date: '2026-10-22' })).toBe(
            'Hello – 2026-10-22',
        );
    });

    it('leaves unknown variables untouched', () => {
        expect(engine.render('{{ missing }}', {})).toBe('{{ missing }}');
    });

    it('applies upper and lower filters', () => {
        expect(engine.render('{{ title | upper }}', { title: 'Hello' })).toBe('HELLO');
        expect(engine.render('{{ title | lower }}', { title: 'Hello' })).toBe('hello');
    });

    it('maps arrays of objects by key and joins them', () => {
        const data = { tags: [{ name: 'a' }, { name: 'b' }] };
        expect(engine.render('{{ tags | map("name") | join(", ") }}', data)).toBe('a, b');
    });

    it('supports pipes inside quoted filter arguments', () => {
        expect(engine.render('{{ list | join(" | ") }}', { list: ['a', 'b'] })).toBe('a | b');
    });

    it('applies replace and blockquote filters', () => {
        expect(engine.render('{{ text | replace("a", "o") }}', { text: 'banana' })).toBe('bonono');
        expect(engine.render('{{ text | blockquote }}', { text: 'a\nb' })).toBe('> a\n> b');
    });

    it('renders loops', () => {
        const data = { items: [{ name: 'x' }, { name: 'y' }] };
        expect(engine.render('{% for item in items %}- {{ item.name }}\n{% endfor %}', data)).toBe('- x\n- y\n');
    });

    it('does not re-interpret template syntax inside substituted values', () => {
        const data = { content: 'Vue uses {{ message }} and 100%off%', message: 'INJECTED', off: 'INJECTED' };
        expect(engine.render('{{ content }}', data)).toBe('Vue uses {{ message }} and 100%off%');
    });

    it('does not re-interpret template syntax inside loop output', () => {
        const data = { items: ['{{ secret }}'], secret: 'INJECTED' };
        expect(engine.render('{% for item in items %}{{ item }}{% endfor %}', data)).toBe('{{ secret }}');
    });

    it('supports string and number literals', () => {
        expect(engine.render("{{ 'hello world' | capitalize }}", {})).toBe('Hello world');
        expect(engine.render('{{ 12682 | numberLexify }}', {})).toBe('12.7K');
    });

    it('formats numbers with numberLexify', () => {
        expect(engine.render('{{ count | numberLexify }}', { count: 12500 })).toBe('12.5K');
    });
});
