import { CEventType, dateProps2dateString } from "../store/mdPropsStore"
import { DatetimeRangeType, getDateProps } from "../utils/datetime"

export type HashtagType = {
    name: string
    value?: string
}
export type DateHashtagType = Omit<HashtagType, "value"> & {
    value: DatetimeRangeType
}
export const dateHashtagList: { [name: string]: CEventType } = {
    due: "due",
    plan: "plan",
}

export const regexpHashtag = new RegExp(
    "(?:[ 　]|^)[#]([^\\s:]+)(?:[:](\\S+))?(?=[ 　]|$)",
    "g"
)

/**
 *
 * @param text
 * @returns
 */
export const splitHashtag = (text: string): HashtagType[] => {
    return Array.from(text.matchAll(regexpHashtag), (hashtag) => {
        return { name: hashtag[1], value: hashtag[2] }
    })
}

const regstrDateHashtag = new RegExp(
    "[~]?(\\d{4}-\\d{1,2}-\\d{1,2})([T_](\\d{1,2}(:\\d{1,2}(:\\d{1,2})?)?))?",
    "g"
)

/**
 *
 * @param dateHashtagValue
 * @returns
 */
export const dateHashtagValue2dateRange = (
    dateHashtagValue: string
): DatetimeRangeType => {
    // "2025-4-1T10:00:00~2025-10-11T12"
    // ---> ['2025-4-1T10:00:00', '2025-4-1', 'T10:00:00', '10:00:00', ':00:00', ':00',]
    // ---> ['~2025-10-11T12', '2025-10-11', 'T12', '12', undefined, undefined,]
    const hashtagValue = dateHashtagValue
    /*
        .replace("#", "")
        .replace("scheduled:", "")
    */
    const dates = Array.from(hashtagValue.matchAll(regstrDateHashtag), (m) => {
        const d = {
            year: Number(m[1].split("-")[0]),
            month: Number(m[1].split("-")[1]),
            day: Number(m[1].split("-")[2]),
            hour: Number(m[2] ? m[2].replace("T", "").split(":")[0] : 0), //'T10:00:00'
            minute: Number(m[3] ? m[3].split(":")[1] : 0), //'10:00:00'
        }
        return {
            ...d,
            date: new Date(d.year, d.month - 1, d.day, d.hour, d.minute),
        }
    })
    return {
        start: dates[0].date,
        end:
            dates[1] && !Number.isNaN(dates[1].date.getTime())
                ? dates[1].date
                : null,
    }
}

/**
 *
 * @param dateRange
 * @returns
 */
export const dateRange2dateHashtagValue = (dateRange: {
    start: Date
    end: Date | null
}) => {
    let d = getDateProps(dateRange.start, String)
    const startStr = dateProps2dateString(d) //`${d.year.padStat(4,'0')}-${d.month.padStat(2,'0')}-${d.day.padStat(2,'0')}T${d.hour.padStat(2,'0')}:${d.minute.padStat(2,'0')}`
    let endStr = ""
    if (
        dateRange.end &&
        dateRange.start.getTime() !== dateRange.end.getTime()
    ) {
        d = getDateProps(dateRange.end)
        endStr = `~${dateProps2dateString(d)}` //`~${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
    }
    const dateHashtagValue = `${startStr}${endStr}`
    return dateHashtagValue
}

export const isDateHashtag = (hashtag: string | HashtagType) => {
    //@ts-ignore
    return Object.keys(dateHashtagList).includes(hashtag.name || hashtag)
}
/**
 *
 * @param hashtags
 * @returns
 */
export const filterDateHashtag = (
    hashtags: HashtagType[]
): DateHashtagType[] => {
    return hashtags
        .filter((hashtag) => {
            return isDateHashtag(hashtag.name)
        })
        .map((dateHashtagRaw) => {
            if (dateHashtagRaw.value === undefined) {
                throw Error(
                    `DateHashtag must have tagvalue.(${dateHashtagRaw})`
                )
            }
            return {
                name: dateHashtagRaw.name,
                value: dateHashtagValue2dateRange(dateHashtagRaw.value),
            }
        })
}

/**
 *
 */
export const getCEventTypeByDateHashtagName = (
    dateHashtagName: string
): CEventType => {
    if (Object.keys(dateHashtagList).includes(dateHashtagName)) {
        return dateHashtagList[dateHashtagName]
    }
    return "event"
}
