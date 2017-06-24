export default class Hoge {
    hp: number = 20

    takeDamage(point) {
        this.hp -= point
    }
}