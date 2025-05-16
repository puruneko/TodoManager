import {
    T_CEventType,
    T_MdRange,
    toDateStringFromDateProps,
} from "../store/mdPropsStore"
import { T_DatetimeRange, getDateProps } from "../utils/datetime"

export type T_Hashtag = {
    name: string
    value?: string
    range?: T_MdRange
}
export type T_DateHashtag = Omit<T_Hashtag, "value"> & {
    value: T_DatetimeRange
}
export const HASHTAG_PREFIX = "#"

export const dateHashtagList: { [name: string]: T_CEventType } = {
    due: "due",
    plan: "plan",
    event: "event",
}

export const regexpHashtag = new RegExp(
    `([ 　]|^)[${HASHTAG_PREFIX}]([^\\s:]+)(?:[:](\\S+))?(?=[ 　]|$)`,
    "g"
)

export const removeHashtagPrefix = (hashtagStr: string): string => {
    return hashtagStr.replace(new RegExp(`([ 　]|^)?[${HASHTAG_PREFIX}]`), "")
}

export const getHashtagByName = (
    hashtags: T_Hashtag[],
    hashtagName: string
): T_Hashtag | null => {
    const resHashtag = hashtags.filter((hashtag) => {
        return hashtag.name == hashtagName
    })
    if (resHashtag.length <= 1) {
        if (resHashtag.length == 1) {
            return resHashtag[0]
        }
        return null
    }
    throw Error(`duplicate hashtag name: ${hashtagName}`)
}

type T_MatchHashtag = {
    match: RegExpExecArray
    hashtag: T_Hashtag
}
export const toHashtagFromMatch = (match: RegExpExecArray): T_Hashtag => {
    const [whole, sep, name, value] = match
    const res: T_Hashtag = {
        name,
        value,
    }
    return res
}
export const matchAllHashtag = (hashtagStr: string): T_MatchHashtag[] => {
    const matches = Array.from(hashtagStr.matchAll(regexpHashtag), (match) => {
        return {
            match,
            hashtag: toHashtagFromMatch(match),
        } as T_MatchHashtag
    })
    return matches
}
export const matchHashtag = (hashtagStr: string): T_MatchHashtag | null => {
    let res: T_MatchHashtag | null = null
    const removed = removeHashtagPrefix(hashtagStr)
    const cleaned = `${HASHTAG_PREFIX}${removed}`
    const matches = matchAllHashtag(cleaned)
    if (matches.length > 0) {
        res = matches[0]
    }
    return res
}

/**
 * hashtagStrからhashtagのnameとvalueを抜き出す
 * @param hashtagStr
 * @returns T_Hashtag| null
 */
export const getHashtagFromString = (hashtagStr: string): T_Hashtag | null => {
    const removed = removeHashtagPrefix(hashtagStr)
    const cleaned = `${HASHTAG_PREFIX}${removed}`
    const res = matchHashtag(cleaned)
    return res ? res.hashtag : null
}

/*
export const splitHashtag = (text: string): T_MatchHashtag[] => {
    return Array.from(text.matchAll(regexpHashtag), (match) => {
        const index = match.index
        const [whole, sep, name, value] = match
        const range: T_MdRange = {
            start: {
                lineNumber: -1,
                column: -1,
                offset: index + sep.length,
            },
            end: {
                lineNumber: -1,
                column: -1,
                offset: index + sep.length + whole.length,
            },
        }
        return {
            match: hashtag,
            hashtag:{ name: name, value: value, range: range }
    })
}
*/

const regstrDateHashtag = new RegExp(
    "[~]?(\\d{4}-\\d{1,2}-\\d{1,2})([T_](\\d{1,2}(:\\d{1,2}(:\\d{1,2})?)?))?",
    "g"
)

/**
 *
 * @param dateHashtagValue
 * @returns
 */
export const toDateRangeFromDateHashtagValue = (
    dateHashtagValue: string
): T_DatetimeRange => {
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
export const toDateHashtagValueFromDateRange = (dateRange: {
    start: Date
    end: Date | null
}) => {
    let d = getDateProps(dateRange.start, String)
    const startStr = toDateStringFromDateProps(d) //`${d.year.padStat(4,'0')}-${d.month.padStat(2,'0')}-${d.day.padStat(2,'0')}T${d.hour.padStat(2,'0')}:${d.minute.padStat(2,'0')}`
    let endStr = ""
    if (
        dateRange.end &&
        dateRange.start.getTime() !== dateRange.end.getTime()
    ) {
        d = getDateProps(dateRange.end)
        endStr = `~${toDateStringFromDateProps(d)}` //`~${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}`
    }
    const dateHashtagValue = `${startStr}${endStr}`
    return dateHashtagValue
}

export const updateHashtag = (
    hashtags: T_Hashtag[],
    newHashtag: T_Hashtag | null
): T_Hashtag[] => {
    if (newHashtag) {
        let updated = false
        let newHashtags = hashtags.map((tag) => {
            if (tag.name == newHashtag.name) {
                updated = true
                return newHashtag
            } else {
                return tag
            }
        })
        if (!updated) {
            newHashtags.push(newHashtag)
        }
        return newHashtags
    }
    return hashtags
}

export const isDateHashtag = (hashtag: string | T_Hashtag) => {
    //@ts-ignore
    return Object.keys(dateHashtagList).includes(hashtag.name || hashtag)
}
/**
 *
 * @param hashtags
 * @returns
 */
export const filterDateHashtag = (hashtags: T_Hashtag[]): T_DateHashtag[] => {
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
                value: toDateRangeFromDateHashtagValue(dateHashtagRaw.value),
                range: dateHashtagRaw.range,
            }
        })
}

/**
 *
 */
export const getT_CEventByDateHashtagName = (
    dateHashtagName: string
): T_CEventType => {
    if (Object.keys(dateHashtagList).includes(dateHashtagName)) {
        return dateHashtagList[dateHashtagName]
    }
    return "event"
}
