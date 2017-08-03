export default class Hoge {
    hp: number = 70

    takeDamage(point) {
        this.hp -= point
    }
}