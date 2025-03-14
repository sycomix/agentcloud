'use strict';

import { ObjectId } from 'mongodb';

import toObjectId from '../lib/misc/toobjectid';
import * as db from './index';

export type CheckoutSession = {
	_id?: ObjectId;
	accountId?: ObjectId;
	checkoutSessionId: string;
	createdDate: Date;
	payload: any; //TODO: make this use stripe typings?
};

export function CheckoutSessionCollection() {
	return db.db().collection('checkoutsessions');
}

export function getCheckoutSessionById(accountId: db.IdOrStr, checkoutSessionId: string): Promise<CheckoutSession> {
	return CheckoutSessionCollection().findOne({
		checkoutSessionId: checkoutSessionId,
		accountId: toObjectId(accountId),
	});
}

export function unsafeGetCheckoutSessionById(checkoutSessionId: string): Promise<CheckoutSession> {
	return CheckoutSessionCollection().findOne({
		checkoutSessionId: checkoutSessionId,
	});
}

export function getCheckoutSessionByAccountId(accountId: db.IdOrStr): Promise<CheckoutSession> {
	return CheckoutSessionCollection().findOne({
		accountId: toObjectId(accountId),
	});
}

export async function addCheckoutSession(checkoutSession: CheckoutSession): Promise<db.InsertResult> {
	return CheckoutSessionCollection().insertOne(checkoutSession);
}

export function deleteCheckoutSessionById(accountId: db.IdOrStr, checkoutSessionId: string): Promise<any> {
	return CheckoutSessionCollection().deleteOne({
		checkoutSessionId: checkoutSessionId,
		accountId: toObjectId(accountId),
	});
}
