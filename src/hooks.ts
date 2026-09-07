import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => request.url.pathname;
