export type T_DatetimeRange = {
    start: Date
    end: Date | null
}
export type T_DatetimeProps<T = number> = {
    year: T
    month: T
    day: T
    hour: T
    minute: T
    second: T
}
export const getDateProps = <T = number>(
    d: Date,
    typeFunc?: (d: any) => T
): T_DatetimeProps<T> | null => {
    const _typeFunc = typeFunc ? typeFunc : (d: any) => Number(d) as T
    try {
        return {
            year: _typeFunc(d.getFullYear()),
            month: _typeFunc(d.getMonth() + 1),
            day: _typeFunc(d.getDate()),
            hour: _typeFunc(d.getHours()),
            minute: _typeFunc(d.getMinutes()),
            second: _typeFunc(d.getSeconds()),
        }
    } catch (e) {
        return null
    }
}
export const dateT_Props2string = (dateProps: any) => {
    if (dateProps) {
        return {
            year: String(dateProps.year).padStart(4, "0"),
            month: String(dateProps.month).padStart(2, "0"),
            day: String(dateProps.day).padStart(2, "0"),
            hour: String(dateProps.hour).padStart(2, "0"),
            minute: String(dateProps.minute).padStart(2, "0"),
            second: String(dateProps.second).padStart(2, "0"),
        }
    }
    return null
}
