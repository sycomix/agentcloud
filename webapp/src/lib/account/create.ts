'use strict';

import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import bcrypt from 'bcrypt';
import { addAccount,OAuthRecordType } from 'db/account';
import { InsertResult } from 'db/index';
import { addOrg } from 'db/org';
import { addTeam } from 'db/team';
import { addVerification,VerificationTypes } from 'db/verification';
import * as ses from 'lib/email/ses';
import SecretKeys from 'lib/secret/secretkeys';
import { getSecret } from 'lib/secret/secretmanager';
import { ObjectId } from 'mongodb';
import { OAUTH_PROVIDER, OAuthStrategy } from 'struct/oauth';

export default async function createAccount(email: string, name: string, password: string, invite?: boolean, provider?: OAUTH_PROVIDER, profileId?: string | number)
	: Promise<{ emailVerified: boolean; addedAccount: InsertResult; }> {

	// Create mongo id or new account
	const newAccountId = new ObjectId();

	// Create airbyte workspace for user (NOTE: not used, we use 1 shared workspace and this might be removed in future)
	let airbyteWorkspaceId = null;
	if (process.env.AIRBYTE_USERNAME) {
		const workspaceApi = await getAirbyteApi(AirbyteApiType.WORKSPACES);
		const workspace = await workspaceApi.createWorkspace(null, {
			name: newAccountId.toString(), // account _id stringified as workspace name
		}).then(res => res.data);
		airbyteWorkspaceId = workspace.workspaceId;
	}

	// Create default org and team for account
	const addedOrg = await addOrg({
		name: `${name}'s Org`,
		teamIds: [],
		members: [newAccountId],
	});
	const addedTeam = await addTeam({
		name: `${name}'s Team`,
		orgId: addedOrg.insertedId,
		members: [newAccountId],
		airbyteWorkspaceId,
	});
	const orgId = addedOrg.insertedId;
	const teamId = addedTeam.insertedId;

	// Create account and verification token to be sent in email
	const amazonKey = await getSecret(SecretKeys.AMAZON_ACCESSKEYID);
	const emailVerified = amazonKey == null;
	const passwordHash = password ? (await bcrypt.hash(password, 12)) : null;
	const oauth = provider ? { [provider as OAUTH_PROVIDER]: { id: profileId } } : {} as OAuthRecordType;
	const [addedAccount, verificationToken] = await Promise.all([
		addAccount({
			_id: newAccountId,
			name,
			email,
			passwordHash,
			orgs: [{
				id: orgId,
				name: `${name}'s Org`,
				teams: [{
					id: teamId,
					name: `${name}'s Team`,
					airbyteWorkspaceId,
				}]
			}],
			currentOrg: orgId,
			currentTeam: teamId,
			emailVerified,
			oauth,
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL)
	]);

	// If SES key is present, send verification email else set emailVerified to true
	if (!emailVerified) {
		await ses.sendEmail({
			from: process.env.FROM_EMAIL_ADDRESS,
			bcc: null,
			cc: null,
			replyTo: null,
			to: [email],
			subject: invite
				? 'You\'ve been invited to Agentcloud 🎉'
				: 'Verify your email',
			body: invite
				? `Click here to accept the invitation: ${process.env.URL_APP}/verify?token=${verificationToken}&newpassword=true`
				: `Verify your email: ${process.env.URL_APP}/verify?token=${verificationToken}`,
		});
	}

	return { emailVerified, addedAccount }; //Can add more to return if necessary

}
