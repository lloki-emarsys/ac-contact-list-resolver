import {config} from 'dotenv'
config()

import { Message } from '@google-cloud/pubsub'
import { PubSub, Topic } from '@google-cloud/pubsub'
import {cl} from "../src/cl";
import {chunk} from "../src/chunk";


const runContactList = async () => {
    const topic = (new PubSub()).topic('ac-reporting-contact-list')
    const subscription = topic.subscription('ac-reporting-contact-list-sub')
    subscription.on('message', (message: Message) => {
        void (async () => {
            await cl({ data: message.data.toString() }, {})
            message.ack()
        })()
    })
    console.info('🦢 contact list worker started')
}

const runChunk = async () => {
    const topic = (new PubSub()).topic('ac-reporting-contact-list-chunks')
    const subscription = topic.subscription('ac-reporting-contact-list-chunks-sub')
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
