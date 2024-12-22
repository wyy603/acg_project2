export function diff<T>(lastarr: T[], newarr: T[]) {
    const adds: T[] = [], dels: T[] = [];
    for(const elem of newarr) {
        if(!lastarr.includes(elem)) adds.push(elem);
    }
    for(const elem of lastarr) {
        if(!newarr.includes(elem)) dels.push(elem);
    }
    return [adds, dels]
}

export function delFromArr<T>(arr: T[], x: T) {
    return arr.filter(elem => elem !== x);
}