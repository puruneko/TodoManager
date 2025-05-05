//DEBUG
const isDebugPrint = true
export const __debugPrint__ = (...args: any) => {
    if (isDebugPrint) {
        console.debug(
            ...args.map((x: any) => {
                try {
                    return structuredClone(x)
                } catch (e) {
                    return x
                }
            })
        )
    }
}
