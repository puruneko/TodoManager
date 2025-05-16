export const dictMap = (dict: any, mapFunc: (key: any, value: any) => any) => {
    return Object.keys(dict).reduce((d, key) => {
        d[key] = mapFunc(key, dict[key])
        return d
    }, {} as typeof dict)
}
