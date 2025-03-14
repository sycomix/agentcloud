import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../../api';
import GroupForm from '../../../../components/GroupForm';
import { useAccountContext } from '../../../../context/account';

export default function EditGroup(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [agents, setAgents] = useState(null);
	const [error, setError] = useState();
	const { groupData } = state;

	async function fetchAgents() {
		API.getGroup({
			resourceSlug,
			groupId: router.query.groupId,
		}, dispatch, setError, router);
		await API.getAgents({
			resourceSlug,
		}, setAgents, setError, router);
	}
	useEffect(() => {
		if (!groupData || !agents) {
			fetchAgents();
		}
	}, [resourceSlug]);

	if (groupData == null || agents == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Edit Group - ${teamName}`}</title>
		</Head>

		<div>
			<a
				className='mb-4 inline-flex align-center rounded-md bg-indigo-600 pe-3 ps-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				href={`/${resourceSlug}/groups`}
			>
				<ChevronLeftIcon className='w-5 me-1' />
				<span>Back</span>
			</a>
		</div>

		<div className='border-b pb-2 my-2 mb-6'>
			<h3 className='font-semibold text-gray-900'>Edit Group</h3>
		</div>

		<GroupForm editing={true} group={groupData} agentChoices={agents.agents} fetchAgents={fetchAgents} />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
