import { Context } from '@google-cloud/functions-framework'
import {PubSub} from "@google-cloud/pubsub";
import {ChunkMesssageType} from "./types";
import {env} from "./env";

const customerIds = env('ENABLED_CUSTOMER_IDS', '').split(',').map(Number.parseInt)
const chunkSize = Number.parseInt(env('CHUNK_SIZE', '1000'))

interface Participant {
    contact_list_id?: any;
    count: number;
    contact_id: number;
    trigger_id: string;
    execution_result: string;
    route_id: number;
    deduplication_id: string;
    continued_in_program: boolean;
}

interface NodeExecutionMessage {
    customer_id: number;
    ac_program_id: number;
    node_id: number;
    event_time: Date;
    program_entry_time?: any;
    testing_mode: boolean;
    execution_id: string;
    execution_phase: string;
    participants: Participant[];
}

const topic = (new PubSub()).topic(env('CHUNK_PUBSUB_TOPIC_NAME'))

export const cl = async (message: { data?: string }, context: Context): Promise<void> => {
    const messageData = JSON.parse(message.data ?? '{}') as NodeExecutionMessage
    if (!customerIds.includes(messageData.customer_id)) {
        return
    }
    for (const participantData of messageData.participants) {
        if (!participantData.contact_list_id || participantData.count === 0) {
            continue
        }
        for (let i = 0; i < participantData.count; i+=chunkSize) {
            const msg: ChunkMesssageType = {
                customerId: messageData.customer_id,
                contactListId: participantData.contact_list_id,
                pagination: {
                    from: i,
                    to: i + chunkSize - 1
                }
            };
            const id = await topic.publishMessage({
                data: Buffer.from(JSON.stringify(msg))
            })
        }
    }
}
