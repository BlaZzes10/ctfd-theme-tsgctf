import Vue from 'vue';
import groupBy from 'lodash/groupBy';

const categoryOrders = [
	'warmup',
	'pwn',
	'rev',
	'web',
	'crypto',
	'stego',
];

export const state = () => ({
	challenges: [],
	solves: new Set(),
});

export const getters = {
	getChallenges: (s) => (
		s.challenges.map((challenge) => ({
			...challenge,
			solved: s.solves.has(challenge.id),
		}))
	),
	getCategories: (s, g) => (
		Object.entries(groupBy(g.getChallenges, ({category}) => category)).map(([name, challenges]) => ({
			name,
			challenges,
		})).sort((a, b) => {
			const orderA = categoryOrders.indexOf(a.name.toLowerCase());
			const orderB = categoryOrders.indexOf(b.name.toLowerCase());
			return (orderA === -1 ? 9999 : orderA) - (orderB === -1 ? 9999 : orderB);
		})
	),
};

export const mutations = {
	setChallenges(s, payload) {
		s.challenges = payload;
		for (const challenge of s.challenges) {
			challenge.details = null;
		}
	},
	setSolves(s, solves) {
		s.solves = new Set(solves.map((solve) => solve.challenge_id));
	},
	setChallengeDetail(s, {id, data}) {
		const target = s.challenges.findIndex((challenge) => challenge.id === id);
		Vue.set(s.challenges, target, {
			...s.challenges[target],
			details: data,
		});
	},
};

export const actions = {
	async updateChallenges({commit, dispatch}, {$axios}) {
		const {data, headers} = await $axios.get('/api/v1/challenges');
		if (headers['content-type'] === 'application/json') {
			commit('setChallenges', data.data);
		} else {
			commit('setIsLoggedIn', false, {root: true});
		}
		await dispatch('updateSolved', {$axios});
	},
	async updateSolved({commit}, {$axios}) {
		const {data, headers} = await $axios.get('/api/v1/users/me/solves');
		if (headers['content-type'] === 'application/json') {
			commit('setSolves', data.data);
		} else {
			commit('setIsLoggedIn', false, {root: true});
		}
	},
	async getDetail({commit}, {$axios, id}) {
		const {data, headers} = await $axios.get(`/api/v1/challenges/${id}`);
		if (headers['content-type'] === 'application/json') {
			commit('setChallengeDetail', {id, data: data.data});
		} else {
			commit('setIsLoggedIn', false, {root: true});
		}
	},
};