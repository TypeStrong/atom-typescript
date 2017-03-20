export interface NewTile {
  item: any
  priority: number
}

export interface Tile {
  getPriority(): number
  getItem(): any
  destroy()
}

export interface StatusBar {
  addLeftTile(tile: NewTile)
  addRightTile(tile: NewTile)
  getLeftTiles(): Tile[]
  getRightTiles(): Tile[]
}
