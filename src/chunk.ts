import { Context } from '@google-cloud/functions-framework'
import {PubSub} from "@google-cloud/pubsub";
import {ChunkMesssageType} from "./types";
// @ts-ignore
import suite from 'escher-suiteapi-js'

const topic = (new PubSub()).topic('ac-reporting-contact-list-contacts')

export const chunk = async (message: { data?: string }, context: Context): Promise<void> => {
    const messageData = JSON.parse(message.data ?? '{}') as ChunkMesssageType
    const options = new suite.Options('api-proxy.s.emarsys.com', {
        port: 443,
        rejectUnauthorized: true,
        secure: true,
        credentialScope: process.env['SUITE_ESCHER_CREDENTIAL_SCOPE'] ?? '',
        timeout: 15000
    });
    const request = suite.create('ac-contact-list_suite_v2', process.env['SUITE_ESCHER_SECRET'] ?? '', options)
    const apiResult = await request.get(`/api/v2/internal/${messageData.customerId}/contactlist/${messageData.contactListId}`, {
        offset: messageData.pagination.from,
        limit: messageData.pagination.to - messageData.pagination.from
    })
    const contactIds = apiResult.body.data.map(Number.parseInt) as number[]
    const messages = contactIds.map(contactId => ({
        customerId: messageData.customerId,
        contactListId: messageData.contactListId,
        contactId,
        eventTime: '2022-05-13T08:29:40.189104+00:00'
    }))
    await Promise.all(messages.map(async msg => {
        const id = await topic.publishMessage({
            data: Buffer.from(JSON.stringify(msg))
        })
        console.log({id})
    }))
}

// projects/ems-ac-reporting/topics/ac-reporting-contact-list-contacts
