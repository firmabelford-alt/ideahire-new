import test from 'node:test';
import assert from 'node:assert/strict';
import { getJobExpiryInfo, nextListingExpiryDelay } from '../src/JobListingState.js';
const now=Date.parse('2026-10-27T16:00:00Z');
const row=offset=>({expires_at:new Date(now+offset).toISOString()});
test('a listing disappears at its exact expiry, including timezone offsets',()=>{
  assert.equal(getJobExpiryInfo(row(-1).expires_at,now).expired,true);
  assert.equal(getJobExpiryInfo(row(0).expires_at,now).expired,true);
  assert.equal(getJobExpiryInfo(row(1).expires_at,now).expired,false);
  assert.equal(getJobExpiryInfo('2026-10-27T17:00:00+01:00',now).expired,true);
});
test('listing clock waits for the nearest expiry without polling expired rows',()=>{
  assert.equal(nextListingExpiryDelay([row(-1000),row(5000),row(1000)],now),1050);
  assert.equal(nextListingExpiryDelay([row(-1000),row(0)],now),null);
  assert.equal(nextListingExpiryDelay([],now),null);
});
test('listing clock safely handles corrupt dates and long publication periods',()=>{
  assert.equal(nextListingExpiryDelay([{expires_at:'wrong'},row(1000)],now),1050);
  assert.equal(nextListingExpiryDelay([row(3000000000)],now),2147483647);
});
