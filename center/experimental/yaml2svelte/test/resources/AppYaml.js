import 'svelte/internal/disclose-version';
import * as $ from 'svelte/internal/client';
import { onMount } from 'svelte';
import { globImportToRecord } from '@/center/utils/neutral';
import { onresizeobserver } from '@/center/utils/runes.svelte';
import { default as favicon } from './favicon.jpg';
import { default as noise } from './noise.png';
import { default as guard3 } from './guard3';
import { default as VerticalRhythmLines } from './components/VerticalRhythmLines.svelte';
import { default as PagesList } from './components/PagesList.svelte';

if (import.meta.hot) {
	let scrollY = 0;
	let scrollX = 0;

	// before the module is replaced, capture scroll
	import.meta.hot.dispose(() => {
		scrollX = window.scrollX;
		scrollY = window.scrollY;
		sessionStorage.setItem('__hmr_scroll', JSON.stringify({ x: scrollX, y: scrollY }));
	});

	// after the new module is accepted, restore scroll
	import.meta.hot.accept(() => {
		const raw = sessionStorage.getItem('__hmr_scroll');

		if (raw) {
			const { x, y } = JSON.parse(raw);

			requestAnimationFrame(() => {
				window.scrollTo(x, y);
			});
		}
	});
}

var root_1 = $.template(`<link rel="icon" type="image/jpg">`);

var on_click = (ev) => {
	const el = document.getElementById('nav-start');

	el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	ev.preventDefault();
};

var root = $.template(`<div class="flex flex-col min-h-screen relative"><div class="bg-gray-100 text-gray-950 dark:(bg-gray-950! text-gray-100!"><!></div> <div id="nav-start"></div> <div class="[object Object]"><span class="absolute inset-0 pointer-events-none b-t-1 b-b-1 b-black/20 dark:b-white/50"></span> <a href="#nav-start" class="font-serif relative"><div class="absolute top-10% right-100% mr1 h-80% opacity-20 dark:filter-invert"><undefined></undefined></div> Ezequiel Adrián Schwartzman <div class="absolute top-10% left-100% ml1 h-80% scale-x-[-1] opacity-20 dark:filter-invert"><img class="h-full max-w-none" alt="Intricate design on right of name"></div></a></div> <div class="relative flex-grow bg-gray-950 text-white"><!> <!></div></div>`);

export default function _unknown_($$anchor, $$props) {
	$.push($$props, true);
	console.log('Tick 2t4');

	// WORKAROUND FOR A BUG I HAVENT FIGURED OUT YET
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	const preRenderingPathname = typeof global !== 'undefined' ? global.pathname : null;

	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	onMount(() => {});

	let container;
	// PAGES NAVIGATION
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	const props = $.rest_props($$props, ['$$slots', '$$events', '$$legacy']);
	const rawPages = import.meta.glob('./pages/*.(svx|svelte)', { eager: true });
	const pages = globImportToRecord('./pages/', (v) => ({ Component: v.default, metadata: v.metadata }), rawPages);

	function syntheticNavigateTo(navPath) {
		console.log('Synthetic nav');

		const currentState = history.state || {};

		history.replaceState(
			{
				...currentState,
				scrollTop: document.documentElement.scrollTop
			},
			'',
			window.location.pathname
		);

		history.pushState({ path: navPath, scrollTop: 0 }, '', navPath);
		$.set(currentPath, navPath, true);
		document.documentElement.scrollTop = 0;
		recalculatePagesListHeight();
	}

	onMount(() => {
		window.addEventListener('popstate', (event) => {
			const path = event.state?.path || window.location.pathname;
			const scrollTop = event.state?.scrollTop ?? 0;

			$.set(currentPath, path, true);
			recalculatePagesListHeight();
			document.documentElement.scrollTop = scrollTop; // optionally restore scrollTop or do other state updates
		});
	});

	let currentPath = $.state($.proxy(preRenderingPathname ? preRenderingPathname : typeof window !== 'undefined' ? window.location.pathname.length > 1 ? window.location.pathname.replace(/\/$/, '') : window.location.pathname : '/'));
	const navPathToPageName = $.derived(generateNavigationPaths);

	const navPathToPage = $.derived(() => {
		const o = {};

		for (let path in $.get(navPathToPageName)) {
			o[path] = pages[$.get(navPathToPageName)[path]];
		}

		return o;
	});

	const pageNameToNavPath = $.derived(() => {
		const o = {};

		for (let path in $.get(navPathToPageName)) {
			o[$.get(navPathToPageName)[path]] = path;
		}

		return o;
	});

	const currentPageName = $.derived(() => {
		const page = $.get(navPathToPageName)[$.get(currentPath)];

		if (page) return page; else return '404';
	});

	const currentPage = $.derived(() => pages[$.get(currentPageName)]);

	function generateNavigationPaths() {
		let paths = {};

		for (let pageName in pages) {
			if (pageName === '404') continue;

			if (pageName === 'index') {
				paths['/'] = pageName;
			} else {
				paths[`/${pageName}`] = pageName;
			}
		}

		return paths;
	}

	function intersectLinkClicks(ev) {
		if (ev.target instanceof HTMLAnchorElement) {
			const url = new URL(ev.target.href);

			if (url.host === window.location.host) {
				if (url.pathname === $.get(currentPath)) return;
				syntheticNavigateTo(url.pathname);
				ev.preventDefault();
				ev.stopPropagation();
			}
		}
	}

	// PAGES LIST HEIGHT CALCULATION
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	let pagesListHeight = $.state(0);

	// $effect(() => {
	//   if (import.meta.env.SSR) return
	//   CurrentPageComponent
	//   recalculatePagesListHeight()
	// })
	function recalculatePagesListHeight() {
		const contentHeight = container.clientHeight;
		const bodyHeight = document.body.clientHeight;

		if (contentHeight < bodyHeight) {
			$.set(pagesListHeight, bodyHeight - contentHeight + 48);
		} else {
			$.set(pagesListHeight, 48);
		}
	}

	var div = root();

	$.head(($$anchor) => {
		var link = root_1();

		$.set_attribute(link, 'href', favicon);
		$.template_effect(() => $.document.title = $.get(currentPage).metadata?.title || 'Untitled');
		$.append($$anchor, link);
	});

	$.event('click', $.window, intersectLinkClicks);
	$.event('resize', $.window, recalculatePagesListHeight);

	var div_1 = $.child(div);
	var node = $.child(div_1);

	$.component(node, () => $.get(currentPage).Component, ($$anchor, $$component) => {
		$$component($$anchor, {});
	});

	$.reset(div_1);
	$.bind_this(div_1, ($$value) => container = $$value, () => container);
	$.action(div_1, ($$node, $$action_arg) => onresizeobserver?.($$node, $$action_arg), () => recalculatePagesListHeight);

	var div_2 = $.sibling(div_1, 4);
	var a = $.sibling($.child(div_2), 2);

	a.__click = [on_click];

	var div_3 = $.sibling($.child(a), 2);
	var img = $.child(div_3);

	$.set_attribute(img, 'src', guarda);
	$.reset(div_3);
	$.reset(a);
	$.reset(div_2);

	var div_4 = $.sibling(div_2, 2);

	$.set_style(div_4, `background-image: url(${noise});`);

	var node_1 = $.child(div_4);

	{
		var consequent = ($$anchor) => {
			PagesList($$anchor, {
				pages,
				get currentPage() {
					return $.get(currentPageName);
				},
				get pageNameToNavPath() {
					return $.get(pageNameToNavPath);
				}
			});
		};

		$.if(node_1, ($$render) => {
			if (typeof window !== undefined) $$render(consequent);
		});
	}

	var node_2 = $.sibling(node_1, 2);

	VerticalRhythmLines(node_2, {});
	$.reset(div_4);
	$.reset(div);
	$.append($$anchor, div);
	$.pop();
}

$.delegate(['click']);