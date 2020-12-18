export interface Fraction {
    den: number;
    num: number;
}

export interface Points {
    Points: Point[];
}

interface Coordinate {
    Y: number;
    X: number;
}

interface Point {
    handle_type?: 0;
    handle_left?: Coordinate;
    handle_right?: Coordinate;
    co: Coordinate;
    interpolation: number;
}
