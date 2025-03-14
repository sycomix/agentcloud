import { HomeIcon, PlusIcon } from '@heroicons/react/20/solid';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../api';
import NewButtonSection from '../../components/NewButtonSection';
import ToolForm from '../../components/ToolForm';
import ToolList from '../../components/ToolList';
import { useAccountContext } from '../../context/account';

export default function Tools(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [open, setOpen] = useState(false);

	function fetchTools() {
		API.getTools({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTools();
	}, [resourceSlug]);

	const { tools, credentials } = state;

	if (!tools) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Tools - ${teamName}`}</title>
		</Head>

		{tools.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Tools</h3>
		</div>}

		{tools.length === 0 && <NewButtonSection
			link={`/${resourceSlug}/tool/add`}
			emptyMessage={'No tools'}
			icon={<svg
				className='mx-auto h-12 w-12 text-gray-400'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				aria-hidden='true'
			>
				<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
					<path strokeLinecap='round' strokeLinejoin='round' d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' />
				</svg>
			</svg>}
			message={'Get started by creating a tool.'}
			buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
			buttonMessage={'New Tool'}
		/>}
		
		<ToolList tools={tools} fetchTools={fetchTools} />

		{tools.length > 0 && <Link href={`/${resourceSlug}/tool/add`}>
			<button
				type='button'
				className='mt-6 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
				New Tool
			</button>
		</Link>}

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
