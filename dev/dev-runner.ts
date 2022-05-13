import {config} from 'dotenv'
config()

import { Message } from '@google-cloud/pubsub'
import { PubSub, Topic } from '@google-cloud/pubsub'
import {cl} from "../src/cl";
import {chunk} from "../src/chunk";
import {env} from "../src/env";


const runContactList = async () => {
    const topic = (new PubSub()).topic(env('CONTACT_LIST_PUBSUB_TOPIC_NAME'))
    const subscription = topic.subscription('CONTACT_LIST_PUBSUB_SUBSCRIPTION_NAME')
    subscription.on('message', (message: Message) => {
        void (async () => {
            await cl({ data: message.data.toString() }, {})
            message.ack()
        })()
    })
    console.info('🦢 contact list worker started')
}

const runChunk = async () => {
    const topic = (new PubSub()).topic(env('CHUNK_PUBSUB_TOPIC_NAME'))
    const subscription = topic.subscription(env('CHUNK_PUBSUB_SUBSCRIPTION_NAME'))
    subscription.on('message', (message: Message) => {
        void (async () => {
            await chunk({ data: message.data.toString() }, {})
            message.ack()
        })()
    })
    console.info('🐁 chunk worker started')
}

void runContactList()
void runChunk()
