export type OnlyIdRequired<T extends { id?: any }> = Required<Pick<T, "id">> &
    Partial<Omit<T, "id">>
