interface PackageState{

}

export function activate(state:PackageState){
  // console.log('typescript package activated!');
}

export function serialize(): PackageState{
  return {};
}

export function deserialize(){
  /* do any tear down here */
}
