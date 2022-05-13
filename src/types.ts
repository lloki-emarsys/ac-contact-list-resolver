export interface ChunkMesssageType {
    customerId: number,
    contactListId: number,
    pagination: {
        from: number,
        to: number
    }
}
