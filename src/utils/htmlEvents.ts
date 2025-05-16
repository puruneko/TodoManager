export const nonPropagatingEvent = (eventCallback: any) => {
    return (e) => {
        e.preventDefault()
        eventCallback(e)
        e.stopPropagation()
    }
}

/*
const test = (a) => {}
nonPropagatingEvent(() => {test(1)})
nonPropagatingEvent((e) => {test(e)})
*/
