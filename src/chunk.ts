import {Context} from '@google-cloud/functions-framework'
import {PubSub} from "@google-cloud/pubsub";
import {ChunkMesssageType} from "./types";
// @ts-ignore
import suite from 'escher-suiteapi-js'
import {env} from "./env";


const suiteApiHost = env('SUITE_API_HOST');
const escherCredentialScope = env('SUITE_ESCHER_CREDENTIAL_SCOPE')
const escherSecret = env('SUITE_ESCHER_SECRET')

const topic = (new PubSub()).topic(env('CONTACT_PUBSUB_TOPIC_NAME'))

export const chunk = async (message: { data?: string }, context: Context): Promise<void> => {
    const messageData = JSON.parse(message.data ?? '{}') as ChunkMesssageType
    const options = new suite.Options(suiteApiHost, {
        port: 443,
        rejectUnauthorized: true,
        secure: true,
        credentialScope: escherCredentialScope,
        timeout: 15000
    });
    const request = suite.create('ac-contact-list_suite_v2', escherCredentialScope, options)
    const apiResult = await request.get(`/api/v2/internal/${messageData.customerId}/contactlist/${messageData.contactListId}`, {
        offset: messageData.pagination.from,
        limit: messageData.pagination.to - messageData.pagination.from
    })
    const contactIds = apiResult.body.data.map(Number.parseInt) as number[]
    const messages = contactIds.map(contactId => ({
        customerId: messageData.customerId,
        contactListId: messageData.contactListId,
        contactId,
        eventTime: (new Date()).toISOString()
    }))
    await Promise.all(messages.map(async msg => {
        const id = await topic.publishMessage({
            data: Buffer.from(JSON.stringify(msg))
        })
        console.log({id})
    }))
}

// projects/ems-ac-reporting/topics/ac-reporting-contact-list-contacts
