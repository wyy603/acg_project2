export abstract class Game {
    public timeStamp = 0
    constructor(public room: number) {}
    abstract update(): void;
    abstract remove(): void;
};