export default (id:string, arr:any)  =>{
  if (arr.some((e:any) => e.id === id)) {
    return true;
  }
  return false;
}